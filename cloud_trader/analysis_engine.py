import random
from typing import Any, Dict, Optional

from .definitions import SYMBOL_CONFIG, MinimalAgentState


class AnalysisEngine:
    def __init__(self, exchange_client, feature_pipeline, swarm_manager, grok_manager=None):
        self.exchange_client = exchange_client
        self.feature_pipeline = feature_pipeline
        self.swarm_manager = swarm_manager
        self.grok_manager = grok_manager

    async def analyze_market(
        self, agent: MinimalAgentState, symbol: str, ticker_map: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Perform basic technical analysis suited to the agent's specialization.
        Returns a dict with 'signal' ('BUY', 'SELL', 'NEUTRAL'), 'confidence', and 'thesis'.
        """
        print(f"DEBUG: AnalysisEngine analyzing {symbol} for {agent.id}")
        try:
            # 1. Fetch market data
            if ticker_map and symbol in ticker_map:
                ticker = ticker_map[symbol]
            else:
                ticker = await self.exchange_client.get_ticker(symbol)

            if not ticker:
                return {"signal": "NEUTRAL", "confidence": 0.0, "thesis": "No data available"}

            # ENHANCED: Fetch advanced TA data if available
            ta_analysis = await self.feature_pipeline.get_market_analysis(symbol)

            # ENHANCED: Get Swarm Context
            swarm_context = self.swarm_manager.get_swarm_context(agent.id, symbol)

            price = float(ticker.get("lastPrice", 0))
            price_change_pct = float(ticker.get("priceChangePercent", 0))
            high_24h = float(ticker.get("highPrice", 0))
            low_24h = float(ticker.get("lowPrice", 0))
            volume = float(ticker.get("volume", 0))

            if price == 0:
                return {"signal": "NEUTRAL", "confidence": 0.0, "thesis": "Invalid price data"}

            # 2. Derived Indicators (Simplified)
            is_uptrend = price_change_pct > 0
            if ta_analysis:
                is_uptrend = ta_analysis.get("trend") == "BULLISH"

            is_volatile = (high_24h - low_24h) / price > 0.05
            if ta_analysis:
                is_volatile = ta_analysis.get("volatility_state") == "HIGH"

            near_support = (price - low_24h) / (high_24h - low_24h + 0.0001) < 0.2
            near_resistance = (high_24h - price) / (high_24h - low_24h + 0.0001) < 0.2

            # 3. Agent-Specific Logic
            signal = "NEUTRAL"
            confidence = 0.0
            thesis_parts = []

            # Dynamic Confidence Calculation
            trend_strength = min(abs(price_change_pct) / 3.0, 1.0)
            volatility_score = min((high_24h - low_24h) / price / 0.10, 1.0)

            range_pos = (price - low_24h) / (high_24h - low_24h + 0.00001)
            edge_proximity = 2.0 * abs(range_pos - 0.5)

            if "Momentum" in agent.specialization or "Trend" in agent.name:
                base_conf = 0.5 + (trend_strength * 0.4)
                if is_uptrend:
                    signal = "BUY"
                    confidence = base_conf
                    thesis_parts.append(f"Uptrend strength at {trend_strength:.0%}.")
                else:
                    signal = "SELL"
                    confidence = base_conf
                    thesis_parts.append(f"Downtrend strength at {trend_strength:.0%}.")

                if trend_strength < 0.2:
                    thesis_parts.append("Weak momentum, monitoring for continuation.")
                    confidence *= 0.8

            elif "Sentiment" in agent.name or "Prediction" in agent.name:
                base_conf = 0.5 + (edge_proximity * 0.4)
                if range_pos > 0.8:
                    signal = "SELL"
                    confidence = base_conf
                    thesis_parts.append(
                        f"Price near daily high (${high_24h:.2f}). Anticipating reversion."
                    )
                elif range_pos < 0.2:
                    signal = "BUY"
                    confidence = base_conf
                    thesis_parts.append(
                        f"Price near daily low (${low_24h:.2f}). Anticipating bounce."
                    )
                else:
                    signal = "NEUTRAL"
                    confidence = 0.0
                    thesis_parts.append("Price in equilibrium zone. Awaiting breakout.")

            elif "Volume" in agent.name or "HFT" in agent.name:
                base_conf = 0.5 + (volatility_score * 0.4)
                if volatility_score > 0.5:
                    signal = "BUY" if is_uptrend else "SELL"
                    confidence = base_conf
                    thesis_parts.append(
                        f"Volatility elevated ({volatility_score:.0%}). trading breakout."
                    )
                else:
                    signal = "NEUTRAL"
                    confidence = 0.0
                    thesis_parts.append("Low volatility. Accumulating positions.")

            else:
                if is_uptrend and edge_proximity < 0.8:
                    signal = "BUY"
                    confidence = 0.6 + (trend_strength * 0.2)
                    thesis_parts.append("Bullish structure with room to run.")
                elif not is_uptrend and edge_proximity < 0.8:
                    signal = "SELL"
                    confidence = 0.6 + (trend_strength * 0.2)
                    thesis_parts.append("Bearish structure with room to drop.")
                else:
                    signal = "NEUTRAL"
                    confidence = 0.0
                    thesis_parts.append("Conflicting signals. Holding.")

            if confidence > 0.3:
                confidence += random.uniform(-0.01, 0.01)
                confidence = max(0.1, min(0.99, confidence))

            initial_result = {
                "signal": signal,
                "confidence": confidence,
                "thesis": " ".join(thesis_parts),
            }

            # Consult Grok (Hyperliquid Jurisdiction Only)
            # The agent.system field is key here.
            is_hyperliquid = getattr(agent, "system", "aster") == "hyperliquid"

            if (
                self.grok_manager
                and self.grok_manager.enabled
                and signal != "NEUTRAL"
                and is_hyperliquid
            ):
                market_data = {
                    "price": price,
                    "change_24h": price_change_pct,
                    "volume": volume,
                    "volatility": volatility_score,
                    "is_uptrend": is_uptrend,
                    "near_support": near_support,
                    "near_resistance": near_resistance,
                    "trend_strength": trend_strength,
                    "level_proximity": edge_proximity,
                    "ta_analysis": ta_analysis,
                    "swarm_context": swarm_context,
                }

                return await self.grok_manager.consult(symbol, market_data, initial_result)

            return initial_result

        except Exception as e:
            print(f"⚠️ Analysis error for {symbol}: {e}")
            return {"signal": "NEUTRAL", "confidence": 0.0, "thesis": f"Analysis failed: {str(e)}"}
