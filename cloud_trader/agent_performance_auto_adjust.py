"""Real-time agent performance auto-adjustment system."""

from __future__ import annotations

import asyncio
import logging
import statistics
import threading
import time
from collections import defaultdict, deque
from dataclasses import dataclass
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Tuple

from .agent_consensus import AgentConsensusEngine, AgentPerformance
from .market_regime import MarketRegime, RegimeMetrics
from .time_sync import get_precision_clock, get_timestamp_us

logger = logging.getLogger(__name__)


class AdjustmentType(Enum):
    """Types of automatic adjustments that can be made."""

    CONFIDENCE_THRESHOLD = "confidence_threshold"
    POSITION_SIZE_MULTIPLIER = "position_size_multiplier"
    SIGNAL_WEIGHT = "signal_weight"
    CAPITAL_ALLOCATION = "capital_allocation"
    FEATURE_FLAG = "feature_flag"
    DECISION_TIMEOUT = "decision_timeout"
    MAX_CONCURRENT_TRADES = "max_concurrent_trades"


class PerformanceMetric(Enum):
    """Performance metrics to track and optimize."""

    WIN_RATE = "win_rate"
    PROFIT_LOSS = "profit_loss"
    SHARPE_RATIO = "sharpe_ratio"
    MAX_DRAWDOWN = "max_drawdown"
    TRADE_FREQUENCY = "trade_frequency"
    SIGNAL_ACCURACY = "signal_accuracy"
    RESPONSE_TIME = "response_time"
    CONSENSUS_AGREEMENT = "consensus_agreement"


@dataclass
class PerformanceWindow:
    """Rolling performance window for analysis."""

    window_size: int
    values: deque = None

    def __post_init__(self):
        if self.values is None:
            self.values = deque(maxlen=self.window_size)

    def add_value(self, value: float) -> None:
        """Add a new value to the window."""
        self.values.append(value)

    def get_average(self) -> Optional[float]:
        """Get average of values in window."""
        return statistics.mean(self.values) if self.values else None

    def get_trend(self) -> float:
        """Calculate linear trend (-1 to 1, negative = declining)."""
        if len(self.values) < 3:
            return 0.0

        # Simple linear regression slope
        n = len(self.values)
        x = list(range(n))
        y = list(self.values)

        sum_x = sum(x)
        sum_y = sum(y)
        sum_xy = sum(xi * yi for xi, yi in zip(x, y))
        sum_x2 = sum(xi**2 for xi in x)

        slope = (
            (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x**2)
            if (n * sum_x2 - sum_x**2) != 0
            else 0
        )

        # Normalize to -1 to 1 range
        return max(-1.0, min(1.0, slope))

    def is_stable(self, threshold: float = 0.1) -> bool:
        """Check if performance is stable (low variance)."""
        if len(self.values) < 3:
            return False
        return statistics.stdev(self.values) < threshold


@dataclass
class AgentAdjustment:
    """An automatic adjustment made to an agent."""

    agent_id: str
    adjustment_type: AdjustmentType
    old_value: Any
    new_value: Any
    reason: str
    timestamp_us: int
    performance_trigger: Dict[str, float]


@dataclass
class AgentState:
    """Current state and configuration of an agent."""

    agent_id: str
    confidence_threshold: float = 0.5
    position_size_multiplier: float = 1.0
    signal_weight: float = 1.0
    capital_allocation: float = 0.1  # Fraction of total capital
    features_enabled: Dict[str, bool] = None
    decision_timeout_ms: int = 5000
    max_concurrent_trades: int = 5
    last_adjustment: Optional[AgentAdjustment] = None
    adjustment_history: List[AgentAdjustment] = None

    def __post_init__(self):
        if self.features_enabled is None:
            self.features_enabled = {
                "ml_classification": True,
                "regime_filtering": True,
                "correlation_check": True,
                "anomaly_detection": True,
                "partial_exits": True,
            }
        if self.adjustment_history is None:
            self.adjustment_history = []


class PerformanceAutoAdjuster:
    """
    Real-time agent performance monitoring and automatic adjustment system.

    Continuously monitors agent performance and makes automatic adjustments to:
    - Confidence thresholds
    - Position sizes
    - Capital allocation
    - Feature enablement
    - Signal routing
    """

    def __init__(self, consensus_engine: AgentConsensusEngine):
        self.consensus_engine = consensus_engine

        # Performance tracking windows
        self.performance_windows: Dict[str, Dict[PerformanceMetric, PerformanceWindow]] = {}
        self.adjustment_cooldowns: Dict[str, int] = {}  # agent_id -> next adjustment timestamp

        # Adjustment parameters
        self.adjustment_interval_ms = 60000  # Check every minute
        self.min_trades_for_adjustment = 20
        self.cooldown_period_ms = 300000  # 5 minutes between adjustments
        self.max_adjustment_magnitude = 0.3  # Maximum 30% change per adjustment

        # Performance thresholds for adjustments
        self.performance_thresholds = {
            PerformanceMetric.WIN_RATE: {"excellent": 0.65, "good": 0.55, "poor": 0.45},
            PerformanceMetric.PROFIT_LOSS: {"excellent": 0.02, "good": 0.005, "poor": -0.01},
            PerformanceMetric.SHARPE_RATIO: {"excellent": 2.0, "good": 1.0, "poor": 0.5},
            PerformanceMetric.MAX_DRAWDOWN: {"excellent": 0.05, "poor": 0.15},
            PerformanceMetric.SIGNAL_ACCURACY: {"excellent": 0.7, "good": 0.6, "poor": 0.4},
        }

        # Agent states
        self.agent_states: Dict[str, AgentState] = {}
        self.adjustment_history: List[AgentAdjustment] = []

        # Background monitoring
        self.monitoring_active = False
        self.monitoring_thread: Optional[threading.Thread] = None
        self.stop_event = threading.Event()

        # Callbacks for adjustments
        self.adjustment_callbacks: List[Callable[[AgentAdjustment], None]] = []

    def start_monitoring(self) -> None:
        """Start the background performance monitoring and adjustment system."""
        if self.monitoring_active:
            return

        self.monitoring_active = True
        self.stop_event.clear()
        self.monitoring_thread = threading.Thread(target=self._monitoring_loop, daemon=True)
        self.monitoring_thread.start()

        logger.info("Started agent performance auto-adjustment monitoring")

    def stop_monitoring(self) -> None:
        """Stop the background monitoring."""
        if not self.monitoring_active:
            return

        self.monitoring_active = False
        self.stop_event.set()

        if self.monitoring_thread:
            self.monitoring_thread.join(timeout=5.0)

        logger.info("Stopped agent performance auto-adjustment monitoring")

    def register_agent(self, agent_id: str, initial_state: Optional[AgentState] = None) -> None:
        """Register an agent for performance monitoring and adjustment."""
        if initial_state is None:
            initial_state = AgentState(agent_id=agent_id)

        self.agent_states[agent_id] = initial_state

        # Initialize performance windows
        self.performance_windows[agent_id] = {}
        for metric in PerformanceMetric:
            self.performance_windows[agent_id][metric] = PerformanceWindow(window_size=50)

        logger.info(f"Registered agent {agent_id} for auto-adjustment")

    def update_performance(self, agent_id: str, metric: PerformanceMetric, value: float) -> None:
        """Update a performance metric for an agent."""
        if agent_id not in self.performance_windows:
            logger.warning(f"Attempted to update performance for unregistered agent: {agent_id}")
            return

        self.performance_windows[agent_id][metric].add_value(value)

    def record_trade_outcome(
        self,
        agent_id: str,
        pnl: float,
        win: bool,
        confidence: float,
        regime: Optional[MarketRegime] = None,
    ) -> None:
        """Record a trade outcome for performance tracking."""
        if agent_id not in self.agent_states:
            return

        # Update performance windows
        self.update_performance(agent_id, PerformanceMetric.PROFIT_LOSS, pnl)
        self.update_performance(agent_id, PerformanceMetric.WIN_RATE, 1.0 if win else 0.0)
        self.update_performance(agent_id, PerformanceMetric.SIGNAL_ACCURACY, confidence)

        # Calculate and update Sharpe ratio (simplified)
        if len(self.performance_windows[agent_id][PerformanceMetric.PROFIT_LOSS].values) >= 10:
            returns = list(self.performance_windows[agent_id][PerformanceMetric.PROFIT_LOSS].values)
            if len(returns) > 1 and statistics.stdev(returns) > 0:
                sharpe = statistics.mean(returns) / statistics.stdev(returns)
                self.update_performance(agent_id, PerformanceMetric.SHARPE_RATIO, sharpe)

        # Update max drawdown (simplified - would need full P&L history)
        current_max_dd = (
            self.performance_windows[agent_id][PerformanceMetric.MAX_DRAWDOWN].get_average() or 0.05
        )
        if pnl < 0:
            # In a real system, this would track cumulative drawdown
            current_max_dd = max(current_max_dd, abs(pnl))
        self.update_performance(agent_id, PerformanceMetric.MAX_DRAWDOWN, current_max_dd)

    def get_agent_state(self, agent_id: str) -> Optional[AgentState]:
        """Get current state for an agent."""
        return self.agent_states.get(agent_id)

    def add_adjustment_callback(self, callback: Callable[[AgentAdjustment], None]) -> None:
        """Add a callback to be called when adjustments are made."""
        self.adjustment_callbacks.append(callback)

    def _monitoring_loop(self) -> None:
        """Background monitoring loop for performance adjustments."""
        while not self.stop_event.is_set():
            try:
                self._perform_adjustments()
            except Exception as e:
                logger.error(f"Error in performance monitoring loop: {e}")

            # Wait for next check interval
            self.stop_event.wait(self.adjustment_interval_ms / 1000.0)

    def _perform_adjustments(self) -> None:
        """Perform automatic adjustments based on current performance."""
        current_time = get_timestamp_us()

        for agent_id, state in self.agent_states.items():
            # Check cooldown
            if agent_id in self.adjustment_cooldowns:
                if current_time < self.adjustment_cooldowns[agent_id]:
                    continue
                del self.adjustment_cooldowns[agent_id]

            # Check if agent has enough performance data
            if not self._has_sufficient_data(agent_id):
                continue

            # Analyze performance and determine adjustments
            adjustments = self._analyze_and_adjust(agent_id, current_time)

            # Apply adjustments
            for adjustment in adjustments:
                self._apply_adjustment(adjustment)
                self.adjustment_history.append(adjustment)

                # Set cooldown
                self.adjustment_cooldowns[agent_id] = current_time + self.cooldown_period_ms * 1000

                # Call callbacks
                for callback in self.adjustment_callbacks:
                    try:
                        callback(adjustment)
                    except Exception as e:
                        logger.error(f"Error in adjustment callback: {e}")

    def _has_sufficient_data(self, agent_id: str) -> bool:
        """Check if agent has sufficient performance data for adjustments."""
        if agent_id not in self.performance_windows:
            return False

        # Check minimum trades
        win_rate_window = self.performance_windows[agent_id][PerformanceMetric.WIN_RATE]
        if len(win_rate_window.values) < self.min_trades_for_adjustment:
            return False

        return True

    def _analyze_and_adjust(self, agent_id: str, current_time: int) -> List[AgentAdjustment]:
        """Analyze agent performance and determine needed adjustments."""
        adjustments = []
        state = self.agent_states[agent_id]
        windows = self.performance_windows[agent_id]

        # Get current performance metrics
        performance_data = {}
        for metric in PerformanceMetric:
            window = windows[metric]
            performance_data[metric] = {
                "current": window.get_average(),
                "trend": window.get_trend(),
                "stable": window.is_stable(),
            }

        # Analyze each adjustment type
        adjustments.extend(
            self._analyze_confidence_threshold(agent_id, state, performance_data, current_time)
        )
        adjustments.extend(
            self._analyze_position_size(agent_id, state, performance_data, current_time)
        )
        adjustments.extend(
            self._analyze_capital_allocation(agent_id, state, performance_data, current_time)
        )
        adjustments.extend(
            self._analyze_feature_flags(agent_id, state, performance_data, current_time)
        )

        return adjustments

    def _analyze_confidence_threshold(
        self, agent_id: str, state: AgentState, performance_data: Dict, current_time: int
    ) -> List[AgentAdjustment]:
        """Analyze and adjust confidence threshold."""
        adjustments = []

        win_rate = performance_data[PerformanceMetric.WIN_RATE]["current"]
        accuracy = performance_data[PerformanceMetric.SIGNAL_ACCURACY]["current"]
        trend = performance_data[PerformanceMetric.WIN_RATE]["trend"]

        if win_rate is None or accuracy is None:
            return adjustments

        thresholds = self.performance_thresholds[PerformanceMetric.WIN_RATE]
        accuracy_thresholds = self.performance_thresholds[PerformanceMetric.SIGNAL_ACCURACY]

        # Adjust confidence threshold based on performance
        new_threshold = state.confidence_threshold

        if win_rate > thresholds["excellent"] and accuracy > accuracy_thresholds["excellent"]:
            # Excellent performance - can be more selective
            new_threshold = min(0.8, state.confidence_threshold + 0.05)
            reason = "Excellent win rate and accuracy - increasing selectivity"
        elif win_rate < thresholds["poor"] or accuracy < accuracy_thresholds["poor"]:
            # Poor performance - need more signals
            new_threshold = max(0.3, state.confidence_threshold - 0.05)
            reason = "Poor performance - lowering threshold to increase signal volume"
        elif trend < -0.1:  # Declining performance
            # Performance declining - be more conservative
            new_threshold = min(0.75, state.confidence_threshold + 0.03)
            reason = "Declining performance trend - increasing conservatism"
        elif trend > 0.1:  # Improving performance
            # Performance improving - can be more aggressive
            new_threshold = max(0.35, state.confidence_threshold - 0.03)
            reason = "Improving performance trend - reducing conservatism"

        if abs(new_threshold - state.confidence_threshold) > 0.01:  # Minimum change threshold
            adjustments.append(
                AgentAdjustment(
                    agent_id=agent_id,
                    adjustment_type=AdjustmentType.CONFIDENCE_THRESHOLD,
                    old_value=state.confidence_threshold,
                    new_value=new_threshold,
                    reason=reason,
                    timestamp_us=current_time,
                    performance_trigger={
                        "win_rate": win_rate,
                        "accuracy": accuracy,
                        "trend": trend,
                    },
                )
            )

        return adjustments

    def _analyze_position_size(
        self, agent_id: str, state: AgentState, performance_data: Dict, current_time: int
    ) -> List[AgentAdjustment]:
        """Analyze and adjust position size multiplier."""
        adjustments = []

        win_rate = performance_data[PerformanceMetric.WIN_RATE]["current"]
        pnl = performance_data[PerformanceMetric.PROFIT_LOSS]["current"]
        max_dd = performance_data[PerformanceMetric.MAX_DRAWDOWN]["current"]

        if win_rate is None or pnl is None or max_dd is None:
            return adjustments

        thresholds = self.performance_thresholds[PerformanceMetric.WIN_RATE]

        new_multiplier = state.position_size_multiplier

        if win_rate > thresholds["excellent"] and pnl > 0 and max_dd < 0.1:
            # Excellent performance - can increase position sizes
            new_multiplier = min(2.0, state.position_size_multiplier * 1.1)
            reason = "Excellent performance - increasing position sizes"
        elif win_rate < thresholds["poor"] or pnl < -0.01 or max_dd > 0.15:
            # Poor performance or high risk - reduce position sizes
            new_multiplier = max(0.3, state.position_size_multiplier * 0.9)
            reason = "Poor performance/high risk - reducing position sizes"
        elif max_dd > 0.12:  # High drawdown - be more conservative
            new_multiplier = max(0.5, state.position_size_multiplier * 0.95)
            reason = "High drawdown detected - conservative position sizing"

        if abs(new_multiplier - state.position_size_multiplier) > 0.05:  # Minimum 5% change
            adjustments.append(
                AgentAdjustment(
                    agent_id=agent_id,
                    adjustment_type=AdjustmentType.POSITION_SIZE_MULTIPLIER,
                    old_value=state.position_size_multiplier,
                    new_value=new_multiplier,
                    reason=reason,
                    timestamp_us=current_time,
                    performance_trigger={"win_rate": win_rate, "pnl": pnl, "max_drawdown": max_dd},
                )
            )

        return adjustments

    def _analyze_capital_allocation(
        self, agent_id: str, state: AgentState, performance_data: Dict, current_time: int
    ) -> List[AgentAdjustment]:
        """Analyze and adjust capital allocation."""
        adjustments = []

        win_rate = performance_data[PerformanceMetric.WIN_RATE]["current"]
        pnl = performance_data[PerformanceMetric.PROFIT_LOSS]["current"]
        sharpe = performance_data[PerformanceMetric.SHARPE_RATIO]["current"]

        if win_rate is None or pnl is None or sharpe is None:
            return adjustments

        thresholds = self.performance_thresholds[PerformanceMetric.WIN_RATE]

        new_allocation = state.capital_allocation

        if win_rate > thresholds["excellent"] and sharpe > 1.5 and pnl > 0.01:
            # Excellent performance - increase capital allocation
            new_allocation = min(0.3, state.capital_allocation * 1.15)
            reason = "Excellent risk-adjusted performance - increasing capital allocation"
        elif win_rate < thresholds["poor"] or sharpe < 0.5 or pnl < -0.005:
            # Poor performance - reduce capital allocation
            new_allocation = max(0.02, state.capital_allocation * 0.85)
            reason = "Poor performance - reducing capital allocation"

        if abs(new_allocation - state.capital_allocation) > 0.01:  # Minimum 1% change
            adjustments.append(
                AgentAdjustment(
                    agent_id=agent_id,
                    adjustment_type=AdjustmentType.CAPITAL_ALLOCATION,
                    old_value=state.capital_allocation,
                    new_value=new_allocation,
                    reason=reason,
                    timestamp_us=current_time,
                    performance_trigger={"win_rate": win_rate, "pnl": pnl, "sharpe_ratio": sharpe},
                )
            )

        return adjustments

    def _analyze_feature_flags(
        self, agent_id: str, state: AgentState, performance_data: Dict, current_time: int
    ) -> List[AgentAdjustment]:
        """Analyze and adjust feature flags based on performance."""
        adjustments = []

        win_rate = performance_data[PerformanceMetric.WIN_RATE]["current"]
        accuracy = performance_data[PerformanceMetric.SIGNAL_ACCURACY]["current"]

        if win_rate is None or accuracy is None:
            return adjustments

        # Disable complex features if performance is poor
        if win_rate < 0.45 or accuracy < 0.5:
            # Poor performance - disable advanced features
            features_to_disable = ["ml_classification", "partial_exits", "correlation_check"]
            for feature in features_to_disable:
                if state.features_enabled.get(feature, False):
                    adjustments.append(
                        AgentAdjustment(
                            agent_id=agent_id,
                            adjustment_type=AdjustmentType.FEATURE_FLAG,
                            old_value=True,
                            new_value=False,
                            reason=f"Poor performance - disabling {feature}",
                            timestamp_us=current_time,
                            performance_trigger={
                                "win_rate": win_rate,
                                "accuracy": accuracy,
                                "feature": feature,
                            },
                        )
                    )
        elif win_rate > 0.6 and accuracy > 0.65:
            # Good performance - enable advanced features
            features_to_enable = ["ml_classification", "partial_exits", "correlation_check"]
            for feature in features_to_enable:
                if not state.features_enabled.get(feature, False):
                    adjustments.append(
                        AgentAdjustment(
                            agent_id=agent_id,
                            adjustment_type=AdjustmentType.FEATURE_FLAG,
                            old_value=False,
                            new_value=True,
                            reason=f"Good performance - enabling {feature}",
                            timestamp_us=current_time,
                            performance_trigger={
                                "win_rate": win_rate,
                                "accuracy": accuracy,
                                "feature": feature,
                            },
                        )
                    )

        return adjustments

    def _apply_adjustment(self, adjustment: AgentAdjustment) -> None:
        """Apply an adjustment to the agent state."""
        state = self.agent_states[adjustment.agent_id]

        if adjustment.adjustment_type == AdjustmentType.CONFIDENCE_THRESHOLD:
            state.confidence_threshold = adjustment.new_value
        elif adjustment.adjustment_type == AdjustmentType.POSITION_SIZE_MULTIPLIER:
            state.position_size_multiplier = adjustment.new_value
        elif adjustment.adjustment_type == AdjustmentType.CAPITAL_ALLOCATION:
            state.capital_allocation = adjustment.new_value
        elif adjustment.adjustment_type == AdjustmentType.FEATURE_FLAG:
            feature_name = adjustment.performance_trigger.get("feature")
            if feature_name:
                state.features_enabled[feature_name] = adjustment.new_value

        state.last_adjustment = adjustment
        state.adjustment_history.append(adjustment)

        logger.info(
            f"Applied adjustment to {adjustment.agent_id}: {adjustment.adjustment_type.value} "
            f"{adjustment.old_value} -> {adjustment.new_value} ({adjustment.reason})"
        )

    def get_performance_summary(self) -> Dict[str, Any]:
        """Get comprehensive performance and adjustment summary."""
        summary = {
            "total_agents": len(self.agent_states),
            "active_adjustments": len(self.adjustment_history),
            "recent_adjustments": [],
        }

        # Get recent adjustments (last 10)
        recent = self.adjustment_history[-10:] if self.adjustment_history else []
        for adj in recent:
            summary["recent_adjustments"].append(
                {
                    "agent_id": adj.agent_id,
                    "type": adj.adjustment_type.value,
                    "change": f"{adj.old_value} -> {adj.new_value}",
                    "reason": adj.reason,
                    "timestamp_us": adj.timestamp_us,
                }
            )

        # Agent performance overview
        agent_overview = {}
        for agent_id, state in self.agent_states.items():
            if agent_id in self.performance_windows:
                windows = self.performance_windows[agent_id]
                win_rate = windows[PerformanceMetric.WIN_RATE].get_average()
                pnl = windows[PerformanceMetric.PROFIT_LOSS].get_average()

                agent_overview[agent_id] = {
                    "win_rate": win_rate,
                    "avg_pnl": pnl,
                    "confidence_threshold": state.confidence_threshold,
                    "position_multiplier": state.position_size_multiplier,
                    "capital_allocation": state.capital_allocation,
                    "active_features": sum(
                        1 for enabled in state.features_enabled.values() if enabled
                    ),
                    "last_adjustment": (
                        state.last_adjustment.adjustment_type.value
                        if state.last_adjustment
                        else None
                    ),
                }

        summary["agent_overview"] = agent_overview
        return summary


# Global auto-adjuster instance
_auto_adjuster: Optional[PerformanceAutoAdjuster] = None


async def get_performance_auto_adjuster(
    consensus_engine: Optional[AgentConsensusEngine] = None,
) -> PerformanceAutoAdjuster:
    """Get global performance auto-adjuster instance."""
    global _auto_adjuster
    if _auto_adjuster is None:
        if consensus_engine is None:
            consensus_engine = await get_agent_consensus_engine()
        _auto_adjuster = PerformanceAutoAdjuster(consensus_engine)
    return _auto_adjuster
