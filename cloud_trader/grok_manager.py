import aiohttp
import json
import time
import asyncio
from typing import Dict, List, Optional, Any
from .definitions import MinimalAgentState

class GrokManager:
    def __init__(self, api_key: str, mcp_client=None, telegram_service=None):
        self.api_key = api_key
        self.mcp = mcp_client
        self.telegram = telegram_service
        self.enabled = bool(api_key)

    async def consult(self, symbol: str, market_data: Dict, agent_signal: Dict) -> Dict:
        """Consult Grok 4.1 for advanced reasoning and optimization."""
        if not self.enabled:
            return agent_signal

        try:
            prompt = f"""You are Grok 4.1, a superior AI trading strategist.
Analyze this trade setup and OPTIMIZE it for maximum profitability.

Market Context for {symbol}:
- Price: ${market_data.get('price', 0)}
- 24h Change: {market_data.get('change_24h', 0)}%
- Volume: {market_data.get('volume', 0)}
- Volatility Score (0-1): {market_data.get('volatility', 0):.2f}
- Trend Strength (0-1): {market_data.get('trend_strength', 0):.2f}
- Near Support? {market_data.get('near_support', False)}
- Near Resistance? {market_data.get('near_resistance', False)}
- Note: {market_data.get('note', 'None')}

Agent Proposal:
- Signal: {agent_signal.get('signal')}
- Confidence: {agent_signal.get('confidence', 0):.2f}
- Thesis: {agent_signal.get('thesis')}

Task:
1. Verify the logic step-by-step. Consider the volatility and trend strength.
2. If you agree, boost confidence and refine the thesis.
3. If you disagree or see higher EV, OVERRIDE the signal.
4. Provide a concise "Chain of Thought" reasoning for your decision.

Return JSON ONLY:
{{
  "signal": "BUY"|"SELL"|"NEUTRAL",
  "confidence": 0.0-0.99,
  "thesis": "reasoning",
  "chain_of_thought": "step-by-step analysis..."
}}
"""
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    "https://api.x.ai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": "grok-4-1-fast-reasoning",
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.3,
                        "max_tokens": 1024,
                    },
                    timeout=15,
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        content = data["choices"][0]["message"]["content"]
                        if "```json" in content:
                            content = content.split("```json")[1].split("```")[0].strip()
                        elif "```" in content:
                            content = content.split("```")[1].split("```")[0].strip()

                        result = json.loads(content)
                        return {
                            "signal": result.get("signal", agent_signal["signal"]),
                            "confidence": float(result.get("confidence", agent_signal["confidence"])),
                            "thesis": f"[Grok 4.1] {result.get('thesis', agent_signal['thesis'])}",
                        }
        except Exception as e:
            print(f"⚠️ Grok consultation failed: {e}")

        return agent_signal

    async def run_management_loop(self, agent_states: Dict[str, MinimalAgentState], recent_trades: List[Dict], stop_event: asyncio.Event):
        """
        Grok 4.1 CIO Loop:
        Acts as an autonomous orchestrator to tune, fix, or boost agents based on live performance.
        """
        print("🧠 Starting Grok 4.1 Agent Orchestrator & Manager...")

        while not stop_event.is_set():
            try:
                await asyncio.sleep(300)

                if not self.enabled:
                    continue

                # 1. Gather Portfolio Context
                total_pnl = sum(t.get("pnl", 0.0) for t in recent_trades)
                win_count = sum(1 for t in recent_trades if t.get("pnl", 0) > 0)
                total_count = len(recent_trades)
                portfolio_win_rate = (win_count / total_count * 100) if total_count > 0 else 0.0

                # 2. Gather Agent Stats
                agents_data = []
                for agent in agent_states.values():
                    learning_note = ""
                    if agent.last_intervention:
                        delta_wr = agent.win_rate - agent.last_intervention["pre_win_rate"]
                        action = agent.last_intervention["action"]
                        if delta_wr > 0:
                            learning_note = f"Last action ({action}) IMPROVED win rate by {delta_wr:.1f}%."
                        else:
                            learning_note = f"Last action ({action}) DECREASED win rate by {abs(delta_wr):.1f}%. Revert or try opposite?"

                    agents_data.append({
                        "id": agent.id,
                        "name": agent.name,
                        "win_rate": f"{agent.win_rate:.1f}%",
                        "trades": agent.total_trades,
                        "current_leverage": agent.max_leverage_limit,
                        "risk_tolerance": agent.risk_tolerance,
                        "specialization": agent.specialization,
                        "learning_feedback": learning_note,
                    })

                # 3. Construct Prompt
                prompt = f"""You are the Grok 4.1 Chief Investment Officer (CIO).
Your goal: Maximize Portfolio Return while minimizing Ruin Risk.
You have full authority to EDIT and TUNE agent parameters in real-time based on FEEDBACK.

**IMPORTANT ASTER RULES**:
1. NO HEDGING: Do not hold Long and Short on same asset.
2. NO WASH TRADING: Focus on quality, organic moves. Avoid churn.

Portfolio Status:
- Net PnL: ${total_pnl:.2f}
- Win Rate: {portfolio_win_rate:.1f}%
- Active Agents: {len(agent_states)}

Agent Roster & Learning History:
{json.dumps(agents_data, indent=2)}

Management Instructions:
1. **Self-Learning**: Look at "learning_feedback". If a previous action failed, DO NOT repeat it. If it worked, reinforce it.
2. **Aggressive Mode**: We are in a VOLATILE BULL RUN. If an agent has > 70% Win Rate, you are AUTHORIZED to boost leverage up to 20x (or even 50x for Scalpers if confidence is extreme).
3. **Fix Laggards**: If Win Rate < 40%, reduce leverage drastically or change strategy/risk tolerance.
4. **Dynamic Tuning**: Do not be static. Adapt to the feedback provided.

Return JSON ONLY:
{{
  "analysis": "Brief CIO analysis of current performance and learning",
  "interventions": [
    {{
      "agent_id": "agent-id",
      "action": "TUNE" | "COOLDOWN" | "BOOST" | "REVERT",
      "updates": {{ "max_leverage_limit": 20.0, "risk_tolerance": "high" }},
      "reason": "Detailed reason for this intervention based on history"
    }}
  ]
}}
"""
                # 4. Call Grok API
                async with aiohttp.ClientSession() as session:
                    async with session.post(
                        "https://api.x.ai/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {self.api_key}",
                            "Content-Type": "application/json",
                        },
                        json={
                            "model": "grok-4-1-fast-reasoning",
                            "messages": [{"role": "user", "content": prompt}],
                            "temperature": 0.3,
                        },
                        timeout=30,
                    ) as resp:
                        if resp.status == 200:
                            data = await resp.json()
                            content = data["choices"][0]["message"]["content"]
                            if "```json" in content:
                                content = content.split("```json")[1].split("```")[0].strip()
                            elif "```" in content:
                                content = content.split("```")[1].split("```")[0].strip()

                            decision = json.loads(content)
                            print(f"\n👨‍💼 GROK CIO REPORT: {decision.get('analysis')}")

                            for intervention in decision.get("interventions", []):
                                agent_id = intervention.get("agent_id")
                                if agent_id in agent_states:
                                    agent = agent_states[agent_id]
                                    updates = intervention.get("updates", {})
                                    reason = intervention.get("reason")
                                    action = intervention.get("action")

                                    log_msg = f"🔧 GROK MANAGER: {action} on {agent.name} | {reason}"
                                    print(log_msg)
                                    if self.mcp:
                                        self.mcp.add_message("observation", "Grok CIO", log_msg, "Portfolio Management")

                                    agent.last_intervention = {
                                        "timestamp": time.time(),
                                        "action": action,
                                        "updates": updates,
                                        "pre_win_rate": agent.win_rate,
                                        "pre_pnl": agent.daily_pnl,
                                    }
                                    agent.intervention_history.append(agent.last_intervention)

                                    if "max_leverage_limit" in updates:
                                        new_lev = float(updates["max_leverage_limit"])
                                        new_lev = max(1.0, min(50.0, new_lev))
                                        agent.max_leverage_limit = new_lev

                                    if "risk_tolerance" in updates:
                                        agent.risk_tolerance = updates["risk_tolerance"]

                                    if self.telegram:
                                        await self.telegram.send_message(
                                            f"👨‍💼 *Grok CIO Intervention*\n\n"
                                            f"🎯 *Target:* {agent.name}\n"
                                            f"⚡ *Action:* {action}\n"
                                            f"📝 *Reason:* {reason}\n"
                                            f"🔧 *Updates:* `{json.dumps(updates)}`"
                                        )

            except Exception as e:
                print(f"⚠️ Grok Manager Loop Error: {e}")
