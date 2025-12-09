"""Shared definitions to avoid circular imports."""

from dataclasses import dataclass
from typing import Any, Dict, List, Optional


@dataclass
class HealthStatus:
    running: bool
    paper_trading: bool
    last_error: Optional[str]


AGENT_DEFINITIONS: List[Dict[str, Any]] = [
    {
        "id": "trend-momentum-agent",
        "name": "Trend Momentum (Gemini)",
        "model": "gemini-2.0-flash-exp",
        "system": "aster",
        "emoji": "📈",
        "symbols": [],
        "description": "High-speed momentum analysis using Gemini 2.0 Flash (Next-Gen) for Aster ecosystem.",
        "personality": "Aggressive momentum trader.",
        "baseline_win_rate": 0.65,
        "risk_multiplier": 1.4,
        "profit_target": 0.008,
        "margin_allocation": 500.0,
        "specialization": "momentum_trading",
        "dynamic_position_sizing": True,
        "adaptive_leverage": True,
        "intelligence_tp_sl": True,
        "max_leverage_limit": 12.0,
        "min_position_size_pct": 0.08,
        "max_position_size_pct": 0.25,
        "risk_tolerance": "high",
        "time_horizon": "very_short",
        "market_regime_preference": "trending",
    },
    {
        "id": "financial-sentiment-agent",
        "name": "Sentiment (Gemini)",
        "model": "gemini-2.0-flash-exp",
        "system": "aster",
        "emoji": "💭",
        "symbols": [],
        "description": "Real-time sentiment analysis using Gemini 2.0 Flash (Next-Gen).",
        "personality": "News-driven sentiment trader.",
        "baseline_win_rate": 0.58,
        "risk_multiplier": 1.8,
        "profit_target": 0.012,
        "margin_allocation": 500.0,
        "specialization": "sentiment_analysis",
        "dynamic_position_sizing": True,
        "adaptive_leverage": True,
        "intelligence_tp_sl": True,
        "max_leverage_limit": 14.0,
        "min_position_size_pct": 0.08,
        "max_position_size_pct": 0.28,
        "risk_tolerance": "high",
        "time_horizon": "short_medium",
        "market_regime_preference": "news_driven",
    },
    {
        "id": "hyperliquid-grok-scalper",
        "name": "Hyper-Grok Scalper",
        "model": "grok-beta",
        "system": "hyperliquid",
        "emoji": "⚡",
        "symbols": ["HYPE", "PURR", "ETH"],
        "description": "Hyperliquid-native scalper powered by Grok's fast reasoning.",
        "personality": "Ruthless HFT scalper on Hyperliquid L1.",
        "baseline_win_rate": 0.60,
        "risk_multiplier": 2.5,
        "profit_target": 0.005,
        "margin_allocation": 1000.0,
        "specialization": "hft_scalping",
        "dynamic_position_sizing": True,
        "adaptive_leverage": True,
        "intelligence_tp_sl": True,
        "max_leverage_limit": 25.0,
        "min_position_size_pct": 0.05,
        "max_position_size_pct": 0.15,
        "risk_tolerance": "very_high",
        "time_horizon": "very_short",
        "market_regime_preference": "volatile",
    },
    {
        "id": "hyperliquid-grok-strategist",
        "name": "Hyper-Grok Strategist",
        "model": "grok-beta",
        "system": "hyperliquid",
        "emoji": "🧠",
        "symbols": ["BTC", "SOL"],
        "description": "Deep reasoning strategist for Hyperliquid major pairs.",
        "personality": "Strategic swing trader utilizing Grok's deep logic.",
        "baseline_win_rate": 0.68,
        "risk_multiplier": 1.5,
        "profit_target": 0.025,
        "margin_allocation": 2000.0,
        "specialization": "strategic_swing",
        "dynamic_position_sizing": True,
        "adaptive_leverage": True,
        "intelligence_tp_sl": True,
        "max_leverage_limit": 10.0,
        "min_position_size_pct": 0.1,
        "max_position_size_pct": 0.3,
        "risk_tolerance": "moderate",
        "time_horizon": "medium",
        "market_regime_preference": "trending",
    },
]

# Dedicated list for the Grok Special Ops agent
PREFERRED_SYMBOLS = [
    "ASTERUSDT",
    "SOLUSDT",
    "ETHUSDT",
    "ZECUSDT",
    "PENGUUSDT",
    "HYPEUSDT",
    "MONUSDT",
    "AVLUSDT",
    "PIPPINUSDT",
    "RLSUSDT",
]

# Manual configuration for PREFERRED symbols only (fallback)
SYMBOL_CONFIG = {
    # --- User Preferred (for Grok Agent) ---
    "ASTERUSDT": {"qty": 1000.0, "precision": 1},
    "SOLUSDT": {"qty": 1.0, "precision": 2},
    "ETHUSDT": {"qty": 0.1, "precision": 2},
    "ZECUSDT": {"qty": 1.0, "precision": 2},
    "PENGUUSDT": {"qty": 5000.0, "precision": 0},
    "HYPEUSDT": {"qty": 2000.0, "precision": 1},
    "MONUSDT": {"qty": 3000.0, "precision": 1},
    "AVLUSDT": {"qty": 500.0, "precision": 1},  # Approx $50-$100 depending on price
    "RLSUSDT": {"qty": 1000.0, "precision": 1},  # New listing
    # Dynamic agents will use exchange info for precision
}


@dataclass
class MinimalAgentState:
    """State tracking for a minimal trading agent."""

    id: str
    name: str
    model: str
    emoji: str
    symbols: Optional[List[str]] = None  # Optional - agents can trade any symbols
    description: str = ""
    personality: str = ""
    baseline_win_rate: float = 0.0
    margin_allocation: float = 1000.0
    specialization: str = ""
    active: bool = True
    performance_score: float = 0.0
    last_active: Optional[float] = None
    total_trades: int = 0
    win_rate: float = 0.0
    dynamic_position_sizing: bool = True
    adaptive_leverage: bool = True
    intelligence_tp_sl: bool = True
    max_leverage_limit: float = 10.0
    min_position_size_pct: float = 0.08
    max_position_size_pct: float = 0.25
    risk_tolerance: str = "moderate"
    time_horizon: str = "short"
    market_regime_preference: str = "all_regimes"
    daily_pnl: float = 0.0
    last_intervention: Optional[Dict[str, Any]] = None
    intervention_history: List[Dict[str, Any]] = None
    # Additional fields used in minimal_trading_service.py
    system: str = "aster"  # "aster" or "hyperliquid"
    max_daily_loss_pct: float = 0.05  # 5% daily loss limit
    daily_loss_breached: bool = False
    daily_volume: float = 0.0
    max_position_size_today: float = 0.0
    whale_trade_executed: bool = False
    avalon_spot_volume: float = 0.0

    def __post_init__(self):
        if self.intervention_history is None:
            self.intervention_history = []
