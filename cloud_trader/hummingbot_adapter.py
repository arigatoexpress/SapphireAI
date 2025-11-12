"""Hummingbot MCP Adapter

Integrates Hummingbot with the MCP coordinator for market making and arbitrage.
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any, Dict, Optional

from .config import get_settings
from .mcp import (
    MCPClient,
    MCPHFTSignalPayload,
    MCPMarketDataPayload,
    MCPOrderExecutionPayload,
    MCRiskUpdatePayload,
    MCPStrategyAdjustmentPayload,
    MCPMessageType,
)
from .pubsub import PubSubClient

logger = logging.getLogger(__name__)


class HummingbotMCPAdapter:
    """Adapter for Hummingbot to communicate with MCP coordinator."""

    def __init__(self):
        self.settings = get_settings()
        self.mcp_client: Optional[MCPClient] = None
        self.pubsub_client: Optional[PubSubClient] = None
        self.component_id = "hummingbot-market-maker"
        self._running = False

    async def start(self):
        """Initialize the adapter."""
        # Initialize MCP client
        if self.settings.mcp_url:
            self.mcp_client = MCPClient(
                base_url=self.settings.mcp_url,
                session_id=self.settings.mcp_session_id,
            )
            await self.mcp_client.ensure_session()

        # Initialize Pub/Sub client
        if self.settings.gcp_project_id:
            self.pubsub_client = PubSubClient(self.settings)
            await self.pubsub_client.connect()

        # Register with MCP coordinator
        await self._register_with_coordinator()

        self._running = True
        logger.info("Hummingbot MCP adapter started")

    async def stop(self):
        """Shutdown the adapter."""
        self._running = False
        if self.mcp_client:
            await self.mcp_client.close()
        if self.pubsub_client:
            await self.pubsub_client.close()

    async def _register_with_coordinator(self):
        """Register this component with the MCP coordinator."""
        if not self.mcp_client:
            return

        try:
            await self.mcp_client.publish({
                "message_type": "register",
                "component_id": self.component_id,
                "component_type": "hummingbot",
                "capabilities": ["market_making", "arbitrage", "liquidity_provision"],
            })
        except Exception as e:
            logger.error(f"Failed to register with MCP coordinator: {e}")

    async def publish_signal(self, signal: Dict[str, Any]):
        """Publish a market making signal to the MCP coordinator."""
        if not self.mcp_client:
            return

        try:
            payload = MCPHFTSignalPayload(
                symbol=signal["symbol"],
                side=signal["side"],
                confidence=signal.get("confidence", 0.5),
                notional=signal.get("notional", 0.0),
                price=signal.get("price"),
                rationale=signal.get("rationale", ""),
                source="hummingbot",
                strategy=signal.get("strategy", "market_making"),
                indicators=signal.get("indicators"),
            )

            await self.mcp_client.publish({
                "message_type": MCPMessageType.HFT_SIGNAL,
                "payload": payload.model_dump(),
                "timestamp": asyncio.get_event_loop().time(),
            })

            # Also publish via Pub/Sub
            if self.pubsub_client:
                await self.pubsub_client.publish_hft_signal({
                    "component": "hummingbot",
                    "signal": payload.model_dump(),
                })

        except Exception as e:
            logger.error(f"Failed to publish signal: {e}")

    async def publish_market_data(self, data: Dict[str, Any]):
        """Publish market data update."""
        if not self.mcp_client:
            return

        try:
            payload = MCPMarketDataPayload(
                symbol=data["symbol"],
                price=data["price"],
                volume=data["volume"],
                bid_price=data.get("bid_price"),
                ask_price=data.get("ask_price"),
                timestamp=data.get("timestamp", str(asyncio.get_event_loop().time())),
                source="hummingbot",
            )

            await self.mcp_client.publish({
                "message_type": MCPMessageType.MARKET_DATA,
                "payload": payload.model_dump(),
            })

        except Exception as e:
            logger.error(f"Failed to publish market data: {e}")

    async def publish_order_execution(self, execution: Dict[str, Any]):
        """Publish order execution notification."""
        if not self.mcp_client:
            return

        try:
            payload = MCPOrderExecutionPayload(
                symbol=execution["symbol"],
                side=execution["side"],
                quantity=execution["quantity"],
                price=execution["price"],
                order_id=execution["order_id"],
                timestamp=execution.get("timestamp", str(asyncio.get_event_loop().time())),
                status=execution.get("status", "filled"),
                source="hummingbot",
                fees=execution.get("fees"),
            )

            await self.mcp_client.publish({
                "message_type": MCPMessageType.ORDER_EXECUTION,
                "payload": payload.model_dump(),
            })

            # Also publish via Pub/Sub
            if self.pubsub_client:
                await self.pubsub_client.publish_order_execution({
                    "component": "hummingbot",
                    "execution": payload.model_dump(),
                })

        except Exception as e:
            logger.error(f"Failed to publish order execution: {e}")

    async def publish_risk_update(self, risk_data: Dict[str, Any]):
        """Publish risk management update."""
        if not self.mcp_client:
            return

        try:
            payload = MCRiskUpdatePayload(
                symbol=risk_data.get("symbol"),
                portfolio_risk=risk_data["portfolio_risk"],
                position_risk=risk_data.get("position_risk"),
                drawdown=risk_data["drawdown"],
                leverage=risk_data["leverage"],
                alerts=risk_data.get("alerts"),
                timestamp=risk_data.get("timestamp", str(asyncio.get_event_loop().time())),
            )

            await self.mcp_client.publish({
                "message_type": MCPMessageType.RISK_UPDATE,
                "payload": payload.model_dump(),
            })

        except Exception as e:
            logger.error(f"Failed to publish risk update: {e}")

    async def publish_inventory_adjustment(self, adjustment: Dict[str, Any]):
        """Publish inventory adjustment signal."""
        if not self.mcp_client:
            return

        try:
            payload = MCPStrategyAdjustmentPayload(
                strategy_name="inventory_management",
                parameter="target_inventory",
                old_value=adjustment.get("old_target", 0),
                new_value=adjustment["new_target"],
                reason=adjustment.get("reason", "Market condition adjustment"),
                source="hummingbot",
                timestamp=adjustment.get("timestamp", str(asyncio.get_event_loop().time())),
            )

            await self.mcp_client.publish({
                "message_type": MCPMessageType.STRATEGY_ADJUSTMENT,
                "payload": payload.model_dump(),
            })

        except Exception as e:
            logger.error(f"Failed to publish inventory adjustment: {e}")

    async def consume_consensus_signals(self) -> list:
        """Consume consensus signals from the coordinator."""
        if not self.mcp_client:
            return []

        try:
            # Query the coordinator for consensus decisions
            # This would be implemented based on the coordinator's API
            return []
        except Exception as e:
            logger.error(f"Failed to consume consensus signals: {e}")
            return []

    async def adjust_spread(self, symbol: str, new_spread: float):
        """Adjust market making spread based on consensus."""
        try:
            await self.publish_strategy_adjustment({
                "strategy_name": f"market_making_{symbol}",
                "parameter": "spread",
                "old_value": getattr(self, f"current_spread_{symbol}", 0.005),
                "new_value": new_spread,
                "reason": "Consensus-driven spread adjustment",
                "source": "coordinator",
            })

            # Update local spread
            setattr(self, f"current_spread_{symbol}", new_spread)
            logger.info(f"Adjusted spread for {symbol} to {new_spread}")

        except Exception as e:
            logger.error(f"Failed to adjust spread: {e}")

    async def health_check(self) -> Dict[str, Any]:
        """Perform health check."""
        return {
            "component": "hummingbot",
            "status": "healthy" if self._running else "stopped",
            "mcp_connected": self.mcp_client is not None,
            "pubsub_connected": self.pubsub_client is not None and self.pubsub_client.is_connected(),
        }


# Global adapter instance
_hummingbot_adapter: Optional[HummingbotMCPAdapter] = None


def get_hummingbot_adapter() -> HummingbotMCPAdapter:
    """Get or create global Hummingbot adapter instance."""
    global _hummingbot_adapter
    if _hummingbot_adapter is None:
        _hummingbot_adapter = HummingbotMCPAdapter()
    return _hummingbot_adapter
