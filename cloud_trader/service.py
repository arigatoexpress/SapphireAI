"""Coordinating service that glues together client, strategy, and risk controls."""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass
from typing import Dict, Optional

from .client import AsterClient
from .config import Settings, get_settings
from .risk import PortfolioState, RiskManager
from .secrets import load_credentials
from .strategy import MarketSnapshot, MomentumStrategy, parse_market_payload


logger = logging.getLogger("cloud_trader")


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
        self._strategy = MomentumStrategy()
        self._task: Optional[asyncio.Task[None]] = None
        self._stop_event = asyncio.Event()
        self._health = HealthStatus(running=False, paper_trading=False, last_error=None)
        self._portfolio = PortfolioState(balance=1_000.0, total_exposure=0.0, positions={})

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

        self._task = asyncio.create_task(self._run_loop())

    async def stop(self) -> None:
        self._stop_event.set()
        if self._task:
            await self._task
        if self._client:
            await self._client.close()
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

    async def _tick(self) -> None:
        market = await self._fetch_market()

        for symbol, snapshot in market.items():
            decision = self._strategy.should_enter(symbol, snapshot)
            if not decision:
                continue

            notional = self._strategy.allocate_notional(self._portfolio.balance)
            if not self._risk.can_open_position(self._portfolio, notional):
                logger.info("Risk limits prevent new %s position", symbol)
                continue

            if self.paper_trading:
                logger.info("[PAPER] %s %s @ %.2f", decision, symbol, snapshot.price)
                self._portfolio = self._risk.register_fill(self._portfolio, symbol, notional)
                continue

            await self._execute_order(symbol, decision, snapshot.price, notional)

    async def _execute_order(self, symbol: str, side: str, price: float, notional: float) -> None:
        assert self._client is not None
        quantity = notional / max(price, 1e-8)
        order_payload = {
            "symbol": symbol,
            "side": side,
            "type": "MARKET",
            "quantity": round(quantity, 6),
        }
        try:
            await self._client.place_order(order_payload)
            logger.info("Placed %s order for %s (notional %.2f)", side, symbol, notional)
            self._portfolio = self._risk.register_fill(self._portfolio, symbol, notional)
        except Exception as exc:
            logger.error("Order failed for %s: %s", symbol, exc)
            self._health.last_error = str(exc)

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
