"""MCP Coordinator for HFT Integration

Coordinates communication between LLM agents, Freqtrade, and Hummingbot
for unified autonomous trading decisions.
"""

from __future__ import annotations

import asyncio
import json
import logging
from collections import defaultdict
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional, Set

import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from starlette.responses import JSONResponse

from .config import get_settings
from .mcp import MCPMessageType, MCPProposalPayload, MCPResponsePayload
from .pubsub import PubSubClient

logger = logging.getLogger(__name__)


class ComponentType(str, Enum):
    LLM_AGENT = "llm_agent"
    FREQTRADE = "freqtrade"
    HUMMINGBOT = "hummingbot"
    DASHBOARD = "dashboard"


class TradingSignal(BaseModel):
    symbol: str
    side: str  # "buy" or "sell"
    confidence: float
    notional: float
    rationale: str
    source: ComponentType
    timestamp: datetime


class MarketData(BaseModel):
    symbol: str
    price: float
    volume: float
    timestamp: datetime


class CoordinatorMessage(BaseModel):
    message_type: str
    component_id: str
    component_type: ComponentType
    payload: Dict[str, Any]
    timestamp: datetime


class MCPCoordinator:
    """Coordinates all trading components via MCP protocol."""

    def __init__(self):
        self.settings = get_settings()
        self.pubsub_client = None
        self.app = FastAPI(title="MCP Coordinator", version="1.0.0")

        # Component registry
        self.registered_components: Dict[str, ComponentType] = {}
        self.component_health: Dict[str, datetime] = {}

        # Trading state
        self.active_signals: Dict[str, List[TradingSignal]] = defaultdict(list)
        self.market_data: Dict[str, MarketData] = {}
        self.consensus_decisions: List[Dict[str, Any]] = []

        # Setup routes
        self._setup_routes()

        # Health monitoring
        self.health_check_interval = 30  # seconds
        self.max_health_age = timedelta(minutes=5)

    async def start(self):
        """Initialize the coordinator."""
        # Initialize Pub/Sub client
        if self.settings.gcp_project_id:
            self.pubsub_client = PubSubClient(self.settings)
            await self.pubsub_client.connect()

        # Start health monitoring
        asyncio.create_task(self._health_monitor())

        logger.info("MCP Coordinator started")

    async def stop(self):
        """Shutdown the coordinator."""
        if self.pubsub_client:
            await self.pubsub_client.close()

    def _setup_routes(self):
        """Setup FastAPI routes."""

        @self.app.get("/healthz")
        async def health_check():
            """Health check endpoint."""
            unhealthy_components = []
            now = datetime.now()

            for component_id, last_seen in self.component_health.items():
                if now - last_seen > self.max_health_age:
                    unhealthy_components.append(component_id)

            if unhealthy_components:
                return JSONResponse(
                    status_code=503,
                    content={
                        "status": "degraded",
                        "unhealthy_components": unhealthy_components
                    }
                )

            return {"status": "healthy", "components": len(self.registered_components)}

        @self.app.post("/register")
        async def register_component(message: CoordinatorMessage):
            """Register a component with the coordinator."""
            component_id = message.component_id
            component_type = message.component_type

            self.registered_components[component_id] = component_type
            self.component_health[component_id] = datetime.now()

            logger.info(f"Registered {component_type} component: {component_id}")
            return {"status": "registered", "component_id": component_id}

        @self.app.post("/signal")
        async def receive_signal(signal: TradingSignal):
            """Receive trading signal from a component."""
            # Store signal
            self.active_signals[signal.symbol].append(signal)

            # Publish to Pub/Sub if available
            if self.pubsub_client:
                await self.pubsub_client.publish_reasoning({
                    "component": signal.source.value,
                    "signal": signal.model_dump(),
                    "action": "signal_received"
                })

            # Check for consensus
            await self._check_consensus(signal.symbol)

            return {"status": "received", "signal_id": f"{signal.source}_{signal.timestamp.isoformat()}"}

        @self.app.post("/market-data")
        async def receive_market_data(data: MarketData):
            """Receive market data update."""
            self.market_data[data.symbol] = data

            # Forward to components that need real-time data
            await self._broadcast_market_data(data)

            return {"status": "received"}

        @self.app.get("/consensus/{symbol}")
        async def get_consensus(symbol: str):
            """Get consensus decision for a symbol."""
            consensus = await self._calculate_consensus(symbol)
            return {"symbol": symbol, "consensus": consensus}

        @self.app.get("/status")
        async def get_status():
            """Get overall system status."""
            return {
                "components": {
                    cid: {
                        "type": ctype.value,
                        "healthy": datetime.now() - self.component_health.get(cid, datetime.min) < self.max_health_age
                    }
                    for cid, ctype in self.registered_components.items()
                },
                "active_signals": {symbol: len(signals) for symbol, signals in self.active_signals.items()},
                "market_data": list(self.market_data.keys()),
                "consensus_count": len(self.consensus_decisions)
            }

    async def _check_consensus(self, symbol: str):
        """Check if consensus is reached for a symbol."""
        signals = self.active_signals[symbol]

        # Require signals from at least 2 different component types
        signal_sources = {s.source for s in signals}
        if len(signal_sources) < 2:
            return

        # Calculate consensus confidence
        buy_signals = [s for s in signals if s.side == "buy"]
        sell_signals = [s for s in signals if s.side == "sell"]

        # Simple majority voting
        if len(buy_signals) > len(sell_signals):
            consensus_side = "buy"
            consensus_confidence = sum(s.confidence for s in buy_signals) / len(buy_signals)
        elif len(sell_signals) > len(buy_signals):
            consensus_side = "sell"
            consensus_confidence = sum(s.confidence for s in sell_signals) / len(sell_signals)
        else:
            return  # No clear consensus

        # Create consensus decision
        consensus = {
            "symbol": symbol,
            "side": consensus_side,
            "confidence": consensus_confidence,
            "sources": [s.source.value for s in (buy_signals if consensus_side == "buy" else sell_signals)],
            "timestamp": datetime.now(),
            "rationale": f"Consensus from {len(signal_sources)} component types"
        }

        self.consensus_decisions.append(consensus)

        # Publish consensus
        if self.pubsub_client:
            await self.pubsub_client.publish_decision({
                "consensus": consensus,
                "action": "consensus_reached"
            })

        # Execute consensus action
        await self._execute_consensus(consensus)

        logger.info(f"Consensus reached for {symbol}: {consensus_side} with {consensus_confidence:.2f} confidence")

    async def _execute_consensus(self, consensus: Dict[str, Any]):
        """Execute a consensus trading decision."""
        # Forward to execution components (Freqtrade, Hummingbot)
        execution_payload = {
            "message_type": MCPMessageType.EXECUTION,
            "consensus": consensus,
            "timestamp": datetime.now()
        }

        # Send to all registered components for execution
        for component_id, component_type in self.registered_components.items():
            if component_type in [ComponentType.FREQTRADE, ComponentType.HUMMINGBOT]:
                await self._notify_component(component_id, execution_payload)

    async def _broadcast_market_data(self, data: MarketData):
        """Broadcast market data to components that need it."""
        payload = {
            "message_type": "market_data",
            "data": data.model_dump(),
            "timestamp": datetime.now()
        }

        for component_id in self.registered_components:
            await self._notify_component(component_id, payload)

    async def _notify_component(self, component_id: str, payload: Dict[str, Any]):
        """Notify a component via HTTP or other mechanism."""
        # This would be implemented based on how components expose their APIs
        # For now, use Pub/Sub as the communication mechanism
        if self.pubsub_client:
            await self.pubsub_client.publish_reasoning({
                "target_component": component_id,
                "payload": payload
            })

    async def _calculate_consensus(self, symbol: str) -> Dict[str, Any]:
        """Calculate current consensus for a symbol."""
        signals = self.active_signals[symbol]
        if not signals:
            return {"status": "no_signals"}

        buy_confidence = sum(s.confidence for s in signals if s.side == "buy")
        sell_confidence = sum(s.confidence for s in signals if s.side == "sell")

        total_confidence = buy_confidence + sell_confidence
        if total_confidence == 0:
            return {"status": "neutral"}

        buy_ratio = buy_confidence / total_confidence
        sell_ratio = sell_confidence / total_confidence

        if buy_ratio > 0.6:
            return {"decision": "buy", "confidence": buy_ratio, "signal_count": len(signals)}
        elif sell_ratio > 0.6:
            return {"decision": "sell", "confidence": sell_ratio, "signal_count": len(signals)}
        else:
            return {"decision": "hold", "confidence": max(buy_ratio, sell_ratio), "signal_count": len(signals)}

    async def _health_monitor(self):
        """Monitor component health."""
        while True:
            try:
                # Check for stale components
                now = datetime.now()
                stale_components = []

                for component_id, last_seen in self.component_health.items():
                    if now - last_seen > self.max_health_age:
                        stale_components.append(component_id)

                for component_id in stale_components:
                    logger.warning(f"Component {component_id} appears unhealthy")
                    # Could send alerts or attempt recovery here

                await asyncio.sleep(self.health_check_interval)

            except Exception as e:
                logger.error(f"Health monitoring error: {e}")
                await asyncio.sleep(self.health_check_interval)


# Global coordinator instance
_coordinator: Optional[MCPCoordinator] = None


def get_coordinator() -> MCPCoordinator:
    """Get or create global coordinator instance."""
    global _coordinator
    if _coordinator is None:
        _coordinator = MCPCoordinator()
    return _coordinator


if __name__ == "__main__":
    import uvicorn

    coordinator = get_coordinator()

    @coordinator.app.on_event("startup")
    async def startup_event():
        await coordinator.start()

    @coordinator.app.on_event("shutdown")
    async def shutdown_event():
        await coordinator.stop()

    uvicorn.run(coordinator.app, host="0.0.0.0", port=8081)
