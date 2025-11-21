"""Grok 4.1 Super Heavy arbitration layer for agent consensus conflicts."""

import json
import logging
import os
from typing import Any, Dict, List, Optional

import httpx

logger = logging.getLogger(__name__)


class GrokArbitrator:
    """Grok 4.1 arbitrates when agents disagree significantly."""

    def __init__(self):
        self.api_key = os.getenv("GROK_API_KEY")
        self.enabled = os.getenv("GROK_ARBITRATION_ENABLED", "false").lower() == "true"
        self.client = httpx.AsyncClient(timeout=25.0) if self.enabled else None
        self.override_count = 0

    async def arbitrate_if_needed(
        self,
        agent_signals: List[Dict[str, Any]],
        market_context: Dict[str, Any],
        disagreement_score: float,
    ) -> Optional[Dict[str, Any]]:
        """
        Call Grok 4.1 when agents have high disagreement.

        Args:
            agent_signals: List of agent predictions with confidence
            market_context: Current market state
            disagreement_score: 0-1 score of agent disagreement

        Returns:
            Grok's decision or None if not needed/failed
        """
        if not self.enabled or disagreement_score < 0.4:
            return None

        prompt = f"""You are Grok 4.1 Super Heavy, the ultimate trading arbitrator.

Agent Signals:
{json.dumps(agent_signals, indent=2)}

Market Context:
- Symbol: {market_context.get('symbol')}
- Price: ${market_context.get('price', 0):.2f}
- 24h Change: {market_context.get('change_24h', 0):.2f}%
- Volume: {market_context.get('volume', 0):,.0f}
- Volatility: {market_context.get('volatility', 0):.3f}

Disagreement Score: {disagreement_score:.2f} (High conflict!)

Task: Resolve the conflict and provide a definitive trading decision.

Return ONLY valid JSON with these exact keys:
{{
  "direction": "BUY" | "SELL" | "FLAT",
  "confidence": 0.0-1.0,
  "sizing_multiplier": 0.5-2.0,
  "reasoning": "max 100 words explaining your decision"
}}

If no strong edge exists, return {{"direction": "FLAT", "confidence": 0.0}}"""

        try:
            logger.info(
                f"Calling Grok 4.1 for arbitration (disagreement: {disagreement_score:.2f})"
            )

            resp = await self.client.post(
                "https://api.x.ai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "grok-beta",  # or "grok-4-1" when available
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.0,
                    "max_tokens": 300,
                },
            )
            resp.raise_for_status()

            result_text = resp.json()["choices"][0]["message"]["content"]
            result = json.loads(result_text)

            self.override_count += 1
            logger.info(
                f"✨ Grok arbitration result: {result['direction']} (confidence: {result['confidence']:.2f})"
            )

            return result

        except Exception as e:
            logger.warning(f"Grok arbitration failed: {e}")
            return None

    async def close(self):
        """Close HTTP client."""
        if self.client:
            await self.client.aclose()
