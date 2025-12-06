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
        "name": "Trend Momentum Agent",
        "model": "gemini-flash-latest",
        "emoji": "📈",
        "symbols": [],
        "description": "High-speed momentum analysis using Gemini 2.0 Flash Experimental for real-time trend detection and fast execution.",
        "personality": "Aggressive momentum trader, identifies and exploits strong directional moves with lightning-fast execution.",
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
        "id": "strategy-optimization-agent",
        "name": "Strategy Optimization Agent",
        "model": "gemini-flash-latest",
        "emoji": "🧠",
        "symbols": [],
        "description": "Advanced strategy optimization using Gemini Experimental 1206 for complex analytical reasoning and portfolio optimization.",
        "personality": "Analytical strategist, continuously optimizes trading approaches using advanced reasoning and market analysis.",
        "baseline_win_rate": 0.62,
        "risk_multiplier": 1.6,
        "profit_target": 0.010,
        "margin_allocation": 500.0,
        "specialization": "strategy_optimization",
        "dynamic_position_sizing": True,
        "adaptive_leverage": True,
        "intelligence_tp_sl": True,
        "max_leverage_limit": 10.0,
        "min_position_size_pct": 0.08,
        "max_position_size_pct": 0.22,
        "risk_tolerance": "moderate",
        "time_horizon": "short",
        "market_regime_preference": "all_regimes",
    },
    {
        "id": "financial-sentiment-agent",
        "name": "Financial Sentiment Agent",
        "model": "gemini-flash-latest",
        "emoji": "💭",
        "symbols": [],
        "description": "Real-time sentiment analysis using Gemini 2.0 Flash Experimental for fast processing of news and social media sentiment.",
        "personality": "Sentiment-focused trader, analyzes market psychology and news impact to identify sentiment-driven opportunities.",
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
        "id": "market-prediction-agent",
        "name": "Market Prediction Agent",
        "model": "gemini-flash-latest",
        "emoji": "🔮",
        "symbols": [],
        "description": "Advanced market prediction using Gemini Experimental 1206 for time series forecasting and macroeconomic analysis.",
        "personality": "Predictive analyst, uses advanced models to forecast market movements and identify high-probability setups.",
        "baseline_win_rate": 0.60,
        "risk_multiplier": 1.7,
        "profit_target": 0.011,
        "margin_allocation": 500.0,
        "specialization": "market_prediction",
        "dynamic_position_sizing": True,
        "adaptive_leverage": True,
        "intelligence_tp_sl": True,
        "max_leverage_limit": 11.0,
        "min_position_size_pct": 0.08,
        "max_position_size_pct": 0.24,
        "risk_tolerance": "moderate_high",
        "time_horizon": "medium",
        "market_regime_preference": "predictable",
    },
    {
        "id": "volume-microstructure-agent",
        "name": "Volume Microstructure Agent",
        "model": "gemini-flash-latest",
        "emoji": "📊",
        "symbols": [],
        "description": "Mathematical volume analysis using Codey for precise order flow and microstructure analysis.",
        "personality": "Quantitative analyst, focuses on order book dynamics and institutional activity patterns.",
        "baseline_win_rate": 0.55,
        "risk_multiplier": 2.0,
        "profit_target": 0.006,
        "margin_allocation": 500.0,
        "specialization": "volume_analysis",
        "dynamic_position_sizing": True,
        "adaptive_leverage": True,
        "intelligence_tp_sl": True,
        "max_leverage_limit": 16.0,
        "min_position_size_pct": 0.08,
        "max_position_size_pct": 0.20,
        "risk_tolerance": "high",
        "time_horizon": "very_short",
        "market_regime_preference": "liquid",
    },
    {
        "id": "vpin-hft",
        "name": "VPIN HFT Agent",
        "model": "gemini-flash-latest",
        "emoji": "⚡",
        "symbols": [],
        "description": "High-frequency trading agent using Gemini 2.0 Flash Experimental for real-time order flow toxicity detection and volume microstructure analysis to predict short-term price movements.",
        "personality": "Aggressive, high-frequency, AI-powered pattern recognition in market microstructure.",
        "baseline_win_rate": 0.55,
        "risk_multiplier": 3.0,
        "profit_target": 0.005,
        "margin_allocation": 500.0,
        "specialization": "volume_hft",
        "dynamic_position_sizing": True,
        "adaptive_leverage": True,
        "intelligence_tp_sl": True,
        "max_leverage_limit": 30.0,
        "min_position_size_pct": 0.08,
        "max_position_size_pct": 0.10,
        "risk_tolerance": "very_high",
        "time_horizon": "very_short",
        "market_regime_preference": "volatile",
    },
    {
        "id": "grok-special-ops",
        "name": "Grok Special Ops",
        "model": "grok-4-1-fast-reasoning",
        "emoji": "🚀",
        "symbols": [
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
        ],
        "description": "Special operations agent powered by Grok 4.1 for high-conviction trades.",
        "personality": "Bold, contrarian, and highly analytical.",
        "baseline_win_rate": 0.70,
        "risk_multiplier": 2.5,
        "profit_target": 0.02,
        "margin_allocation": 1000.0,
        "specialization": "special_ops",
        "dynamic_position_sizing": True,
        "adaptive_leverage": True,
        "intelligence_tp_sl": True,
        "max_leverage_limit": 20.0,
        "min_position_size_pct": 0.1,
        "max_position_size_pct": 0.4,
        "risk_tolerance": "very_high",
        "time_horizon": "short",
        "market_regime_preference": "volatile",
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

