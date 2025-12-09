import asyncio
from unittest.mock import AsyncMock, MagicMock

import pytest

from cloud_trader.analysis_engine import AnalysisEngine
from cloud_trader.definitions import MinimalAgentState


@pytest.mark.asyncio
async def test_split_brain_jurisdiction():
    """
    Verify that:
    1. Aster Agents DO NOT trigger Grok.
    2. Hyperliquid Agents DO trigger Grok.
    """

    # Mock Components
    mock_exchange = AsyncMock()
    mock_pipeline = AsyncMock()
    mock_pipeline.get_market_analysis.return_value = {
        "trend": "BULLISH",
        "volatility_state": "HIGH",
    }
    mock_swarm = MagicMock()
    mock_swarm.get_swarm_context.return_value = {}
    mock_grok = AsyncMock()
    mock_grok.enabled = True

    # Setup Engine
    engine = AnalysisEngine(mock_exchange, mock_pipeline, mock_swarm, mock_grok)

    # Create Mock Agents
    aster_agent = MinimalAgentState(
        id="aster_1", name="Aster Bot", model="gemini", system="aster", emoji="A"
    )
    hyper_agent = MinimalAgentState(
        id="hyper_1", name="Hyper Bot", model="grok", system="hyperliquid", emoji="H"
    )

    # Mock Ticker
    mock_exchange.get_ticker.return_value = {
        "lastPrice": 100.0,
        "priceChangePercent": 5.0,
        "highPrice": 110.0,
        "lowPrice": 90.0,
        "volume": 1000.0,
    }

    # Test 1: Aster Agent should NOT consult Grok
    print("\nTesting Aster Agent (should use Gemini)...")
    await engine.analyze_market(aster_agent, "AST/USDT")
    mock_grok.consult.assert_not_called()
    print("✅ Aster Agent correctly bypassed Grok.")

    # Test 2: Hyperliquid Agent SHOULD consult Grok
    print("\nTesting Hyperliquid Agent (should use Grok)...")
    await engine.analyze_market(hyper_agent, "HYPE/USDC")
    mock_grok.consult.assert_called_once()
    print("✅ Hyperliquid Agent correctly consulted Grok.")


if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(test_split_brain_jurisdiction())
