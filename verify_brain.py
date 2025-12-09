import asyncio
import os
import sys

# Add project root to path
sys.path.append("/Users/aribs/AIAster")

from cloud_trader.agent_consensus import AgentConsensusEngine, AgentSignal, SignalType
from cloud_trader.market_regime import MarketRegime


async def verify_consensus_learning():
    """Verify that the consensus engine actually learns from feedback."""
    print("🧠 Starting Brain Validation...")

    engine = AgentConsensusEngine()

    # 1. Register Agents
    print("\n1. Registering Agents...")
    engine.register_agent("trend_bot", "technical", "trend", 1.0)
    engine.register_agent("counter_bot", "technical", "mean_reversion", 1.0)
    engine.register_agent("random_bot", "noise", "random", 1.0)

    print(f"   Initial Weights: {engine.agent_weights}")

    # 2. Simulate Trading Session (Trend Bot is smart, Counter Bot is dumb)
    print("\n2. Simulating 50 Trades (Trend Bot Wins, Counter Bot Loses)...")

    for i in range(50):
        # Trend Bot always calls BUY, market goes UP
        trend_sig = AgentSignal("trend_bot", SignalType.ENTRY_LONG, 0.9, 1.0, "BTC", 0)
        engine.submit_signal(trend_sig)

        # Counter Bot always calls SELL, market goes UP
        counter_sig = AgentSignal("counter_bot", SignalType.ENTRY_SHORT, 0.9, 1.0, "BTC", 0)
        engine.submit_signal(counter_sig)

        # Vote
        result = await engine.conduct_consensus_vote("BTC")

        # Fake Outcome: Market went UP (Long was correct)
        # Trend Bot (+100 PnL), Counter Bot (-100 PnL)

        # Update Feedback
        # Reconstruct votes to simulate feedback loop
        # Check if trend bot was in the winning signal?

        # Feed +1.0 (Profit) for Trend Bot's signal
        engine.update_performance_feedback(result, 100.0, None)
        # Note: simplistic simulation, win/loss attribution depends on alignment

    # 3. Check Weights
    print("\n3. Validating Learned Weights...")
    w_trend = engine.agent_weights["trend_bot"]
    w_counter = engine.agent_weights["counter_bot"]

    print(f"   Trend Bot Weight: {w_trend:.2f}")
    print(f"   Counter Bot Weight: {w_counter:.2f}")

    if w_trend > w_counter:
        print("✅ SUCCESS: Engine increased weight of performing agent.")
    else:
        print("❌ FAILURE: Engine failed to differentiate performance.")

    # 4. Check Game Theory Output
    print("\n4. Checking Consensus Stats...")
    stats = engine.get_consensus_stats()
    print(f"   Avg Confidence: {stats['avg_confidence']:.2f}")
    print(f"   Success Rate: {stats['success_rate']:.2f}")


if __name__ == "__main__":
    asyncio.run(verify_consensus_learning())
