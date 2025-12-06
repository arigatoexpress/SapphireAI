from enum import Enum
from dataclasses import dataclass
from typing import Dict, Any, Optional
import time

class MarketRegimeType(Enum):
    BULL_TRENDING = "BULL_TRENDING"
    BEAR_TRENDING = "BEAR_TRENDING"
    HIGH_VOLATILITY = "HIGH_VOLATILITY"
    LOW_VOLATILITY_CHOP = "LOW_VOLATILITY_CHOP"
    UNKNOWN = "UNKNOWN"

@dataclass
class MarketRegime:
    regime: MarketRegimeType
    confidence: float
    reasoning: str
    timestamp: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "regime": self.regime.value,
            "confidence": self.confidence,
            "reasoning": self.reasoning,
            "timestamp": self.timestamp or time.time()
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'MarketRegime':
        return cls(
            regime=MarketRegimeType(data.get("regime", "UNKNOWN")),
            confidence=data.get("confidence", 0.0),
            reasoning=data.get("reasoning", ""),
            timestamp=data.get("timestamp", 0.0)
        )

@dataclass
class StrategySignal:
    id: str
    source: str  # "conductor" or "risk_guard"
    target_agents: list[str]  # ["momentum", "mean_reversion"]
    action: str  # "ACTIVATE", "PAUSE", "REDUCE_RISK"
    parameters: Dict[str, Any]
    timestamp: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "source": self.source,
            "target_agents": self.target_agents,
            "action": self.action,
            "parameters": self.parameters,
            "timestamp": self.timestamp or time.time()
        }
