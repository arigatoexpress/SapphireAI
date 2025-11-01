"""Coordinating service that glues together client, strategy, and risk controls."""

from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

from .client import AsterClient
from .config import Settings, get_settings
from .messaging import RedisStreamsClient, timestamp
from .optimization.bandit import EpsilonGreedyBandit
from .order_tags import generate_order_tag
from .orchestrator.client import RiskOrchestratorClient
from .risk import PortfolioState, RiskManager, Position
from .secrets import load_credentials
from .schemas import InferenceRequest
from .strategy import MarketSnapshot, MomentumStrategy, parse_market_payload


logger = logging.getLogger("cloud_trader")


def _reward_for(side: str, change: float) -> float:
    if side == "BUY":
        return change
    if side == "SELL":
        return -change
    return 0.0


@dataclass
class HealthStatus:
    running: bool
    paper_trading: bool
    last_error: Optional[str]


class TradingService:
    def __init__(self, settings: Optional[Settings] = None) -> None:
        self._settings = settings or get_settings()
        self._creds = load_credentials()
        self._client: Optional[AsterClient] = None
        self._risk = RiskManager(self._settings)
        self._strategy = MomentumStrategy(
            threshold=self._settings.momentum_threshold,
            notional_fraction=self._settings.notional_fraction,
        )
        self._task: Optional[asyncio.Task[None]] = None
        self._stop_event = asyncio.Event()
        self._health = HealthStatus(running=False, paper_trading=False, last_error=None)
        self._portfolio = PortfolioState(balance=1_000.0, total_exposure=0.0, positions={})
        self._bandit = EpsilonGreedyBandit(self._settings.bandit_epsilon, min_reward=-0.5)
        self._streams = RedisStreamsClient(self._settings)
        self._orchestrator: Optional[RiskOrchestratorClient] = None
        if self._settings.orchestrator_url:
            self._orchestrator = RiskOrchestratorClient(self._settings.orchestrator_url)

    async def dashboard_snapshot(self) -> Dict[str, Any]:
        """Aggregate a lightweight view for the dashboard endpoint."""

        raw_portfolio, orchestrator_status = await self._resolve_portfolio()

        # Transform portfolio data for frontend
        portfolio = self._transform_portfolio_for_frontend(raw_portfolio)

        positions = [
            {
                "symbol": symbol,
                "notional": position.notional,
            }
            for symbol, position in self._portfolio.positions.items()
        ]

        recent_trades = await self._safe_read_stream(self._settings.decisions_stream, count=20)
        model_reasoning = await self._safe_read_stream(self._settings.reasoning_stream, count=10)

        system_status = {
            "services": {
                "cloud_trader": "running" if self._health.running else "stopped",
                "orchestrator": orchestrator_status,
            },
            "models": {
                "deepseek": "unknown",
                "qwen": "unknown",
                "fingpt": "unknown",
                "phi3": "unknown",
            },
            "redis_connected": self._streams.is_connected(),
            "timestamp": datetime.utcnow().isoformat(),
        }

        targets = {
            "daily_pnl_target": 0.0,
            "max_drawdown_limit": -self._settings.max_drawdown * 100,
            "min_confidence_threshold": self._settings.min_llm_confidence,
            "target_win_rate": self._settings.expected_win_rate,
            "alerts": [],
        }

        if raw_portfolio.get("alerts"):
            targets["alerts"].extend(raw_portfolio["alerts"])

        return {
            "portfolio": portfolio,
            "positions": positions,
            "recent_trades": recent_trades,
            "model_performance": [],
            "model_reasoning": model_reasoning,
            "system_status": system_status,
            "targets": targets,
        }

    @property
    def paper_trading(self) -> bool:
        return self._health.paper_trading

    async def start(self) -> None:
        if self._task and not self._task.done():
            logger.info("Trading service already running")
            return

        self._stop_event.clear()
        self._health = HealthStatus(running=True, paper_trading=False, last_error=None)

        if not (self._creds.api_key and self._creds.api_secret) or self._settings.enable_paper_trading:
            logger.warning("Starting in paper trading mode")
            self._health.paper_trading = True
        else:
            self._client = AsterClient(self._settings, self._creds.api_key, self._creds.api_secret)

        await self._streams.connect()
        if self._orchestrator:
            await self._sync_portfolio()
        self._task = asyncio.create_task(self._run_loop())

    async def stop(self) -> None:
        self._stop_event.set()
        if self._task:
            await self._task
        if self._client:
            await self._client.close()
        await self._streams.close()
        if self._orchestrator:
            await self._orchestrator.close()
        self._health = HealthStatus(running=False, paper_trading=self.paper_trading, last_error=self._health.last_error)

    async def _run_loop(self) -> None:
        try:
            while not self._stop_event.is_set():
                await self._tick()
                await asyncio.sleep(self._settings.decision_interval_seconds)
        except Exception as exc:  # pragma: no cover - defensive
            logger.exception("Trading loop error: %s", exc)
            self._health.last_error = str(exc)
        finally:
            self._health.running = False
            await self._publish_portfolio_state()

    async def _tick(self) -> None:
        market = await self._fetch_market()

        for symbol, snapshot in market.items():
            decision = self._strategy.should_enter(symbol, snapshot)
            if not decision:
                continue

            if not self._bandit.allow(symbol):
                await self._streams.publish_reasoning(
                    {
                        "bot_id": self._settings.bot_id,
                        "symbol": symbol,
                        "strategy": "bandit",
                        "message": "bandit_suppressed_trade",
                        "timestamp": timestamp(),
                    }
                )
                continue

            notional = self._strategy.allocate_notional(self._portfolio.balance)
            notional = await self._auto_delever(symbol, snapshot, notional)
            if notional <= 0:
                continue
            if not self._risk.can_open_position(self._portfolio, notional):
                logger.info("Risk limits prevent new %s position", symbol)
                await self._streams.publish_reasoning(
                    {
                        "bot_id": self._settings.bot_id,
                        "symbol": symbol,
                        "strategy": "risk",
                        "message": "risk_limit_block",
                        "timestamp": timestamp(),
                    }
                )
                continue

            order_tag = generate_order_tag(self._settings.bot_id, symbol)
            buffer = self._settings.trailing_stop_buffer
            trail_step = self._settings.trailing_step
            if decision == "BUY":
                take_profit = snapshot.price * (1 + buffer)
                stop_loss = snapshot.price * (1 - buffer)
            else:
                take_profit = snapshot.price * (1 - buffer)
                stop_loss = snapshot.price * (1 + buffer)
            decision_event = {
                "bot_id": self._settings.bot_id,
                "symbol": symbol,
                "side": decision,
                "notional": f"{notional:.2f}",
                "paper": str(self.paper_trading).lower(),
                "strategy": "momentum",
                "price": f"{snapshot.price:.2f}",
                "order_id": order_tag,
                "take_profit": f"{take_profit:.4f}",
                "stop_loss": f"{stop_loss:.4f}",
                "trail_step": f"{trail_step:.4f}",
                "timestamp": timestamp(),
            }
            await self._streams.publish_decision(decision_event)
            await self._streams.publish_reasoning(
                {
                    "bot_id": self._settings.bot_id,
                    "symbol": symbol,
                    "strategy": "momentum",
                    "message": "24h_change_crossed_threshold",
                    "context": json.dumps(
                        {
                            "change_24h": round(snapshot.change_24h, 4),
                            "take_profit": round(take_profit, 4),
                            "stop_loss": round(stop_loss, 4),
                            "trail_step": trail_step,
                        }
                    ),
                    "timestamp": decision_event["timestamp"],
                }
            )

            if self.paper_trading:
                logger.info("[PAPER] %s %s @ %.2f", decision, symbol, snapshot.price)
                self._portfolio = self._risk.register_fill(self._portfolio, symbol, notional)
                await self._publish_portfolio_state()
                self._bandit.update(symbol, _reward_for(decision, snapshot.change_24h))
                continue

            await self._execute_order(
                symbol,
                decision,
                snapshot.price,
                notional,
                order_tag,
                take_profit,
                stop_loss,
                trail_step,
            )
            self._bandit.update(symbol, _reward_for(decision, snapshot.change_24h))

    async def _execute_order(
        self,
        symbol: str,
        side: str,
        price: float,
        notional: float,
        order_tag: str,
        take_profit: float,
        stop_loss: float,
        trail_step: float,
    ) -> None:
        quantity = notional / max(price, 1e-8)
        if self._orchestrator:
            intent_payload = {
                "symbol": symbol,
                "type": "MARKET",
                "side": side,
                "notional": round(notional, 2),
                "quantity": round(quantity, 6),
                "price": round(price, 4),
                "take_profit": round(take_profit, 4),
                "stop_loss": round(stop_loss, 4),
                "expected_win_rate": self._settings.expected_win_rate,
                "reward_to_risk": self._settings.reward_to_risk,
                "client_metadata": {
                    "entry_price": round(price, 4),
                    "trail_step": self._settings.trailing_step,
                },
            }
            try:
                response = await self._orchestrator.submit_order(self._settings.bot_id, intent_payload)
                if response.get("status") not in {"submitted", "approved"}:
                    reason = response.get("reason", "unknown_error")
                    raise RuntimeError(f"orchestrator rejected order: {reason}")
                await self._sync_portfolio()
            except Exception as exc:
                logger.error("Orchestrator route failed for %s: %s", symbol, exc)
                self._health.last_error = str(exc)
                await self._streams.publish_reasoning(
                    {
                        "bot_id": self._settings.bot_id,
                        "symbol": symbol,
                        "strategy": "orchestrator",
                        "message": "order_error",
                        "context": json.dumps({"error": str(exc)}),
                        "timestamp": timestamp(),
                    }
                )
            return

        assert self._client is not None
        order_payload = {
            "symbol": symbol,
            "side": side,
            "type": "MARKET",
            "quantity": round(quantity, 6),
            "clientOrderId": order_tag,
        }
        try:
            await self._client.place_order(order_payload)
            logger.info("Placed %s order for %s (notional %.2f)", side, symbol, notional)
            self._portfolio = self._risk.register_fill(self._portfolio, symbol, notional)
            await self._publish_portfolio_state()
        except Exception as exc:
            logger.error("Order failed for %s: %s", symbol, exc)
            self._health.last_error = str(exc)
            await self._streams.publish_reasoning(
                {
                    "bot_id": self._settings.bot_id,
                    "symbol": symbol,
                    "strategy": "momentum",
                    "message": "order_error",
                    "context": json.dumps({"error": str(exc)}),
                    "timestamp": timestamp(),
                }
            )

    async def _fetch_market(self) -> Dict[str, MarketSnapshot]:
        if self.paper_trading:
            return self._generate_fake_market()

        assert self._client is not None
        result: Dict[str, MarketSnapshot] = {}
        try:
            for symbol in self._settings.symbols:
                payload = await self._client.ticker(symbol)
                result[symbol] = parse_market_payload(
                    {
                        "price": payload.get("lastPrice", 0.0),
                        "volume": payload.get("volume", 0.0),
                        "change_24h": payload.get("priceChangePercent", 0.0),
                    }
                )
        except Exception as exc:
            logger.error("Failed to fetch market data: %s", exc)
            self._health.last_error = str(exc)
        return result

    def _generate_fake_market(self) -> Dict[str, MarketSnapshot]:
        import random

        market: Dict[str, MarketSnapshot] = {}
        for symbol in self._settings.symbols:
            price = random.uniform(10, 1000)
            change = random.uniform(-5, 5)
            volume = random.uniform(1_000, 50_000)
            market[symbol] = parse_market_payload({"price": price, "change_24h": change, "volume": volume})
        return market

    def health(self) -> HealthStatus:
        return self._health

    async def _resolve_portfolio(self) -> Tuple[Dict[str, Any], str]:
        if self._orchestrator:
            try:
                portfolio = await self._orchestrator.portfolio()
                portfolio.setdefault("source", "orchestrator")
                return portfolio, "healthy"
            except Exception as exc:
                logger.warning("Failed to fetch orchestrator portfolio: %s", exc)
                self._health.last_error = self._health.last_error or str(exc)
                return self._serialize_portfolio_state(alert="Orchestrator service unavailable - using local portfolio data"), "unreachable"
        return self._serialize_portfolio_state(), "not_configured"

    def _transform_portfolio_for_frontend(self, raw_portfolio: Dict[str, Any]) -> Dict[str, Any]:
        """Transform raw portfolio data into frontend-expected format."""
        # If it's already in the right format (from local state), return as-is
        if "balance" in raw_portfolio:
            return raw_portfolio

        # Transform Binance futures account data
        try:
            # Extract total wallet balance (USDT)
            total_wallet_balance = 0.0
            total_margin_balance = 0.0
            total_unrealized_pnl = 0.0

            # Sum up balances from assets
            if "assets" in raw_portfolio and isinstance(raw_portfolio["assets"], list):
                for asset in raw_portfolio["assets"]:
                    if asset.get("asset") == "USDT":
                        total_wallet_balance = float(asset.get("walletBalance", 0))
                        total_margin_balance = float(asset.get("marginBalance", 0))
                        total_unrealized_pnl = float(asset.get("unrealizedProfit", 0))
                        break

            # Calculate total exposure from positions
            total_exposure = 0.0
            positions_dict = {}

            if "positions" in raw_portfolio and isinstance(raw_portfolio["positions"], list):
                for position in raw_portfolio["positions"]:
                    if position.get("positionAmt") and float(position.get("positionAmt", 0)) != 0:
                        symbol = position.get("symbol", "").replace("USDT", "")
                        notional = abs(float(position.get("notional", 0)))
                        total_exposure += notional
                        positions_dict[symbol] = {
                            "symbol": symbol,
                            "notional": notional
                        }

            return {
                "balance": total_margin_balance,  # Use margin balance as the main balance
                "total_exposure": total_exposure,
                "positions": positions_dict,
                "source": raw_portfolio.get("source", "orchestrator"),
                "alerts": raw_portfolio.get("alerts", [])
            }

        except Exception as exc:
            logger.warning("Failed to transform portfolio data: %s", exc)
            # Return a safe fallback
            return {
                "balance": 1000.0,
                "total_exposure": 0.0,
                "positions": {},
                "source": "fallback",
                "alerts": [f"Portfolio data parsing error: {str(exc)}"]
            }

    def _serialize_portfolio_state(self, alert: str | None = None) -> Dict[str, Any]:
        portfolio = {
            "balance": round(self._portfolio.balance, 2),
            "total_exposure": round(self._portfolio.total_exposure, 2),
            "positions": {
                symbol: {
                    "symbol": position.symbol,
                    "notional": position.notional,
                }
                for symbol, position in self._portfolio.positions.items()
            },
            "source": "local",
        }
        if alert:
            portfolio["alerts"] = [f"⚠️ {alert}"]
        return portfolio

    async def _safe_read_stream(self, stream: str, count: int) -> List[Dict[str, Any]]:
        try:
            entries = await self._streams.read_latest(stream, count=count)
            return entries
        except Exception as exc:
            logger.debug("Failed to read stream %s: %s", stream, exc)
            return []

    async def accept_inference_decision(self, request: InferenceRequest) -> None:
        """Process LLM-generated trading decisions and execute orders"""
        try:
            decision = request.decision
            confidence = request.confidence or 0.5
            symbol = request.context.symbol

            # Only execute high-confidence decisions
            min_confidence = getattr(self._settings, 'min_llm_confidence', 0.7)
            if confidence < min_confidence:
                logger.info(f"🤖 LLM decision confidence {confidence:.2f} below threshold {min_confidence}, skipping")
                decision.action = "HOLD"  # Override to hold

            # Convert LLM decision to executable order
            if decision.action in ["BUY", "SELL"] and confidence >= min_confidence:
                # Calculate position size based on Kelly criterion and risk limits
                position_size = self._calculate_position_size(decision, request.context, confidence)

                if position_size > 0:
                    order_intent = OrderIntent(
                        symbol=symbol,
                        side=decision.action,
                        notional=position_size,
                        order_type="MARKET",
                    )

                    # Execute through orchestrator
                    if self._orchestrator:
                        await self._orchestrator.submit_order(request.bot_id, order_intent)
                        logger.info(f"✅ LLM trade executed: {decision.action} {position_size} {symbol} (confidence: {confidence:.2f})")
                    else:
                        logger.warning("No orchestrator configured, cannot execute LLM order")
                else:
                    logger.info(f"LLM decision {decision.action} blocked by risk management (size: {position_size})")

            elif decision.action == "CLOSE" and request.context.current_position:
                # Close existing position
                await self._close_position(request.bot_id, symbol)
                logger.info(f"✅ Position closed via LLM decision for {symbol}")

            else:
                logger.info(f"🤖 LLM decision: {decision.action} {symbol} (confidence: {confidence:.2f})")

        except Exception as exc:
            logger.error(f"Failed to process LLM inference decision: {exc}")

        # Update Prometheus metrics
        from .api import TRADING_DECISIONS, LLM_CONFIDENCE, LLM_INFERENCE_TIME
        if request.confidence is not None:
            LLM_CONFIDENCE.observe(request.confidence)
        TRADING_DECISIONS.labels(
            bot_id=request.bot_id,
            symbol=request.context.symbol,
            action=request.decision.action
        ).inc()

        # Log which model was used
        model_used = getattr(request, 'model_used', 'unknown')
        logger.info(f"🤖 LLM Decision from {model_used}: {request.decision.action} {request.context.symbol} (confidence: {request.confidence:.2f})")

        # Always publish decision for telemetry
        decision_payload = {
            "bot_id": request.bot_id,
            "symbol": request.context.symbol,
            "decision": json.dumps(request.decision.model_dump()),
            "context": json.dumps(request.context.model_dump()),
            "confidence": f"{request.confidence:.4f}" if request.confidence is not None else "",
            "timestamp": request.timestamp.isoformat(),
        }
        if self._orchestrator:
            try:
                await self._orchestrator.register_decision(request.model_dump(mode="json"))
            except Exception as exc:
                logger.debug("Failed to register decision with orchestrator: %s", exc)
        await self._streams.publish_decision(decision_payload)

        if request.reasoning:
            await self._streams.publish_reasoning(
                {
                    "bot_id": request.bot_id,
                    "symbol": request.context.symbol,
                    "strategy": "inference",
                    "message": "model_reasoning",
                    "context": json.dumps([slice.model_dump() for slice in request.reasoning]),
                    "timestamp": request.timestamp.isoformat(),
                }
            )

    def _calculate_position_size(self, decision: Any, context: Any, confidence: float) -> float:
        """Calculate position size using Kelly criterion with risk limits"""
        try:
            # Get portfolio information
            portfolio_value = self._portfolio.balance + self._portfolio.total_exposure
            max_position_pct = getattr(self._settings, 'max_position_pct', 0.02)  # 2% default

            # Kelly fraction (simplified)
            kelly_fraction = min(confidence * 0.5, 0.25)  # Cap at 25% Kelly

            # Calculate base position size
            base_size = portfolio_value * max_position_pct * kelly_fraction

            # Adjust for volatility and leverage
            volatility_factor = 1.0  # Could be calculated from price data
            leverage = context.get('leverage', 1)

            position_size = base_size * volatility_factor / leverage

            # Apply risk limits
            max_size = portfolio_value * max_position_pct
            position_size = min(position_size, max_size)

            # Ensure minimum viable position
            min_size = getattr(self._settings, 'min_position_size', 0.001)
            position_size = max(position_size, min_size)

            return position_size

        except Exception as exc:
            logger.warning(f"Failed to calculate position size: {exc}")
            return 0.0

    async def _close_position(self, bot_id: str, symbol: str) -> None:
        """Close existing position for a symbol"""
        try:
            # Get current position
            position = self._portfolio.positions.get(symbol)
            if not position or position.notional == 0:
                logger.info(f"No position to close for {symbol}")
                return

            # Create closing order (opposite side)
            close_side = "SELL" if position.notional > 0 else "BUY"
            close_quantity = abs(position.notional)

            order_intent = OrderIntent(
                symbol=symbol,
                side=close_side,
                notional=abs(position.notional),
                order_type="MARKET",
            )

            # Execute through orchestrator
            if self._orchestrator:
                await self._orchestrator.submit_order(bot_id, order_intent)
                logger.info(f"Position closed: {close_side} {close_quantity} {symbol}")
            else:
                logger.warning("No orchestrator configured, cannot close position")

        except Exception as exc:
            logger.error(f"Failed to close position for {symbol}: {exc}")

    async def _publish_portfolio_state(self) -> None:
        positions = {symbol: position.notional for symbol, position in self._portfolio.positions.items()}
        await self._streams.publish_position(
            {
                "bot_id": self._settings.bot_id,
                "paper": str(self.paper_trading).lower(),
                "balance": f"{self._portfolio.balance:.2f}",
                "total_exposure": f"{self._portfolio.total_exposure:.2f}",
                "positions": json.dumps(positions),
                "timestamp": timestamp(),
            }
        )

    async def _auto_delever(self, symbol: str, snapshot: MarketSnapshot, notional: float) -> float:
        threshold = self._settings.volatility_delever_threshold
        factor = self._settings.auto_delever_factor
        if threshold <= 0 or factor >= 1:
            return notional

        if abs(snapshot.change_24h) < threshold:
            return notional

        adjusted = max(notional * factor, 0.0)
        await self._streams.publish_reasoning(
            {
                "bot_id": self._settings.bot_id,
                "symbol": symbol,
                "strategy": "auto_delever",
                "message": "volatility_threshold_triggered",
                "context": json.dumps(
                    {
                        "change_24h": round(snapshot.change_24h, 4),
                        "factor": factor,
                    }
                ),
                "timestamp": timestamp(),
            }
        )
        return adjusted

    @property
    def settings(self) -> Settings:
        return self._settings

    async def stream_events(self, stream: str, limit: int = 50) -> list[dict[str, str]]:
        return await self._streams.read_latest(stream, count=limit)

    async def _sync_portfolio(self) -> None:
        if not self._orchestrator:
            return
        try:
            payload = await self._orchestrator.portfolio()
        except Exception as exc:
            logger.debug("Unable to sync orchestrator portfolio: %s", exc)
            return

        positions_payload = payload.get("positions") or []
        positions = {
            position["symbol"]: Position(symbol=position["symbol"], notional=float(position["notional"]))
            for position in positions_payload
        }
        balance = float(payload.get("totalWalletBalance", self._portfolio.balance))
        total_exposure = float(
            payload.get("totalPositionInitialMargin", sum(position.notional for position in positions.values()))
        )
        self._portfolio = PortfolioState(balance=balance, total_exposure=total_exposure, positions=positions)

        # Update Prometheus metrics
        from .api import PORTFOLIO_BALANCE, PORTFOLIO_LEVERAGE, POSITION_SIZE
        PORTFOLIO_BALANCE.set(balance)
        leverage_ratio = (total_exposure / balance) if balance > 0 else 0
        PORTFOLIO_LEVERAGE.set(leverage_ratio)

        # Update position metrics
        for symbol, position in positions.items():
            POSITION_SIZE.labels(symbol=symbol).set(position.notional)

        await self._publish_portfolio_state()
