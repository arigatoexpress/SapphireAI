"""Freqtrade MCP Adapter

Integrates Freqtrade with the MCP coordinator for unified autonomous trading.
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


class FreqtradeMCPAdapter:
    """Adapter for Freqtrade to communicate with MCP coordinator."""

    def __init__(self):
        self.settings = get_settings()
        self.mcp_client: Optional[MCPClient] = None
        self.pubsub_client: Optional[PubSubClient] = None
        self.component_id = "freqtrade-hft-bot"
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
        logger.info("Freqtrade MCP adapter started")

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
                "component_type": "freqtrade",
                "capabilities": ["signal_generation", "order_execution", "risk_management"],
            })
        except Exception as e:
            logger.error(f"Failed to register with MCP coordinator: {e}")

    async def publish_signal(self, signal: Dict[str, Any]):
        """Publish a trading signal to the MCP coordinator."""
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
                source="freqtrade",
                strategy=signal.get("strategy", "default"),
                indicators=signal.get("indicators"),
            )

            await self.mcp_client.publish({
                "message_type": MCPMessageType.HFT_SIGNAL,
                "payload": payload.model_dump(),
                "timestamp": asyncio.get_event_loop().time(),
            })

            # Also publish via Pub/Sub for broader distribution
            if self.pubsub_client:
                await self.pubsub_client.publish_hft_signal({
                    "component": "freqtrade",
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
                source="freqtrade",
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
                source="freqtrade",
                fees=execution.get("fees"),
            )

            await self.mcp_client.publish({
                "message_type": MCPMessageType.ORDER_EXECUTION,
                "payload": payload.model_dump(),
            })

            # Also publish via Pub/Sub
            if self.pubsub_client:
                await self.pubsub_client.publish_order_execution({
                    "component": "freqtrade",
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

    async def publish_strategy_adjustment(self, adjustment: Dict[str, Any]):
        """Publish strategy parameter adjustment."""
        if not self.mcp_client:
            return

        try:
            payload = MCPStrategyAdjustmentPayload(
                strategy_name=adjustment["strategy_name"],
                parameter=adjustment["parameter"],
                old_value=adjustment["old_value"],
                new_value=adjustment["new_value"],
                reason=adjustment["reason"],
                source="freqtrade",
                timestamp=adjustment.get("timestamp", str(asyncio.get_event_loop().time())),
            )

            await self.mcp_client.publish({
                "message_type": MCPMessageType.STRATEGY_ADJUSTMENT,
                "payload": payload.model_dump(),
            })

        except Exception as e:
            logger.error(f"Failed to publish strategy adjustment: {e}")

    async def consume_llm_signals(self) -> list:
        """Consume LLM signals from other agents."""
        # This would typically poll the MCP coordinator for consensus decisions
        # For now, return mock signals for demonstration
        if not self.mcp_client:
            return []

        try:
            # In a real implementation, this would query the coordinator
            # for consensus decisions that Freqtrade should execute
            return []
        except Exception as e:
            logger.error(f"Failed to consume LLM signals: {e}")
            return []

    async def health_check(self) -> Dict[str, Any]:
        """Perform health check."""
        return {
            "component": "freqtrade",
            "status": "healthy" if self._running else "stopped",
            "mcp_connected": self.mcp_client is not None,
            "pubsub_connected": self.pubsub_client is not None and self.pubsub_client.is_connected(),
        }


# Global adapter instance
_freqtrade_adapter: Optional[FreqtradeMCPAdapter] = None


def get_freqtrade_adapter() -> FreqtradeMCPAdapter:
    """Get or create global Freqtrade adapter instance."""
    global _freqtrade_adapter
    if _freqtrade_adapter is None:
        _freqtrade_adapter = FreqtradeMCPAdapter()
    return _freqtrade_adapter
