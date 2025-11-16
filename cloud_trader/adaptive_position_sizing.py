"""Adaptive position sizing system based on market regime and risk metrics."""

from __future__ import annotations

import math
import statistics
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

from .market_regime import MarketRegime, RegimeMetrics
from .time_sync import get_timestamp_us


@dataclass
class PositionSizingParams:
    """Parameters for position sizing calculation."""
    base_position_size: float  # Base position size as % of portfolio
    max_position_size: float   # Maximum allowed position size
    min_position_size: float   # Minimum allowed position size
    volatility_multiplier: float  # Adjustment for volatility
    regime_multiplier: float    # Adjustment for market regime
    correlation_penalty: float  # Penalty for high correlation
    confidence_boost: float     # Boost for high confidence signals
    drawdown_reduction: float   # Reduction during drawdowns


@dataclass
class RiskMetrics:
    """Real-time risk metrics for position sizing."""
    portfolio_value: float
    current_drawdown: float
    volatility_24h: float
    sharpe_ratio: float
    max_drawdown_limit: float
    daily_pnl: float
    win_rate_24h: float
    avg_win_loss_ratio: float


class AdaptivePositionSizer:
    """
    Advanced position sizing that adapts to market conditions, regime, and risk metrics.
    Implements Kelly Criterion, volatility targeting, and regime-aware sizing.
    """

    def __init__(self):
        # Historical performance tracking
        self.trade_history: List[Dict] = []
        self.daily_returns: List[float] = []
        self.volatility_history: List[float] = []

        # Kelly Criterion parameters
        self.kelly_fraction = 0.5  # Conservative Kelly fraction
        self.max_kelly_fraction = 2.0

        # Risk limits
        self.max_portfolio_risk = 0.05  # 5% max risk per position
        self.max_correlation_risk = 0.03  # 3% additional risk for correlation
        self.volatility_target = 0.15  # Target annualized volatility

        # Regime-specific adjustments
        self.regime_multipliers = {
            MarketRegime.TRENDING_UP: 1.3,
            MarketRegime.TRENDING_DOWN: 1.3,
            MarketRegime.RANGING: 0.8,
            MarketRegime.VOLATILE: 0.6,
            MarketRegime.CALM: 1.1,
            MarketRegime.UNKNOWN: 1.0
        }

        # Dynamic sizing history
        self.sizing_history: List[Dict] = []

    def calculate_position_size(self,
                              signal_strength: float,
                              confidence: float,
                              regime: Optional[RegimeMetrics],
                              risk_metrics: RiskMetrics,
                              current_positions: List[Dict],
                              symbol: str) -> Dict[str, any]:
        """
        Calculate optimal position size using multiple methodologies.

        Returns comprehensive sizing analysis with recommended position size.
        """

        # Base calculations
        kelly_size = self._calculate_kelly_position(risk_metrics, confidence)
        volatility_size = self._calculate_volatility_targeted_position(risk_metrics)
        regime_size = self._calculate_regime_adjusted_position(regime, kelly_size)

        # Risk-adjusted sizing
        risk_adjusted_size = self._apply_risk_adjustments(
            regime_size, risk_metrics, current_positions, symbol
        )

        # Signal-based adjustments
        signal_adjusted_size = self._apply_signal_adjustments(
            risk_adjusted_size, signal_strength, confidence
        )

        # Final size with bounds checking
        final_size = self._apply_bounds_and_limits(signal_adjusted_size, risk_metrics)

        # Record sizing decision
        sizing_decision = {
            'timestamp_us': get_timestamp_us(),
            'symbol': symbol,
            'signal_strength': signal_strength,
            'confidence': confidence,
            'regime': regime.regime.value if regime else 'unknown',
            'kelly_size': kelly_size,
            'volatility_size': volatility_size,
            'regime_size': regime_size,
            'risk_adjusted_size': risk_adjusted_size,
            'signal_adjusted_size': signal_adjusted_size,
            'final_size': final_size,
            'risk_metrics': {
                'drawdown': risk_metrics.current_drawdown,
                'volatility': risk_metrics.volatility_24h,
                'sharpe': risk_metrics.sharpe_ratio
            }
        }

        self.sizing_history.append(sizing_decision)

        return {
            'recommended_size': final_size,
            'confidence_interval': self._calculate_confidence_interval(final_size, confidence),
            'risk_adjustment': risk_adjusted_size / kelly_size if kelly_size > 0 else 1.0,
            'regime_multiplier': regime_size / kelly_size if kelly_size > 0 else 1.0,
            'reasoning': self._generate_sizing_reasoning(sizing_decision),
            'breakdown': sizing_decision
        }

    def _calculate_kelly_position(self, risk_metrics: RiskMetrics, confidence: float) -> float:
        """Calculate position size using Kelly Criterion with risk adjustments."""

        if len(self.daily_returns) < 10:
            # Fallback to basic sizing if insufficient history
            return self.max_portfolio_risk * confidence

        try:
            # Calculate win rate and win/loss ratio from recent trades
            recent_trades = self.trade_history[-50:] if len(self.trade_history) >= 50 else self.trade_history

            if not recent_trades:
                return self.max_portfolio_risk * confidence

            wins = sum(1 for trade in recent_trades if trade.get('pnl', 0) > 0)
            win_rate = wins / len(recent_trades)

            winning_trades = [t['pnl'] for t in recent_trades if t['pnl'] > 0]
            losing_trades = [abs(t['pnl']) for t in recent_trades if t['pnl'] < 0]

            avg_win = statistics.mean(winning_trades) if winning_trades else 0
            avg_loss = statistics.mean(losing_trades) if losing_trades else 1

            win_loss_ratio = avg_win / avg_loss if avg_loss > 0 else 2.0

            # Kelly formula: (win_rate * (win_loss_ratio + 1) - 1) / win_loss_ratio
            kelly_fraction = (win_rate * (win_loss_ratio + 1) - 1) / win_loss_ratio
            kelly_fraction = max(0, min(kelly_fraction * self.kelly_fraction, self.max_kelly_fraction))

            # Apply confidence adjustment
            kelly_position = kelly_fraction * confidence

            # Risk limit cap
            return min(kelly_position, self.max_portfolio_risk)

        except Exception:
            # Fallback on error
            return self.max_portfolio_risk * confidence

    def _calculate_volatility_targeted_position(self, risk_metrics: RiskMetrics) -> float:
        """Calculate position size based on volatility targeting."""

        # Update volatility history
        self.volatility_history.append(risk_metrics.volatility_24h)
        if len(self.volatility_history) > 50:
            self.volatility_history = self.volatility_history[-50:]

        if len(self.volatility_history) < 5:
            return self.max_portfolio_risk * 0.5

        # Calculate average volatility
        avg_volatility = statistics.mean(self.volatility_history)

        # Volatility-scaled position size
        # Higher volatility = smaller positions to maintain target volatility
        if avg_volatility > 0:
            volatility_scalar = self.volatility_target / avg_volatility
            volatility_scalar = max(0.1, min(volatility_scalar, 3.0))  # Bound scaling
        else:
            volatility_scalar = 1.0

        return self.max_portfolio_risk * volatility_scalar

    def _calculate_regime_adjusted_position(self, regime: Optional[RegimeMetrics],
                                          base_size: float) -> float:
        """Adjust position size based on market regime."""

        if not regime:
            return base_size

        # Get regime multiplier
        regime_multiplier = self.regime_multipliers.get(regime.regime, 1.0)

        # Adjust based on regime confidence
        confidence_adjustment = 0.8 + (regime.confidence * 0.4)  # 0.8 to 1.2

        # Additional adjustments for specific regimes
        if regime.regime == MarketRegime.VOLATILE and regime.volatility_level > 0.8:
            # Extra reduction for extreme volatility
            regime_multiplier *= 0.7
        elif regime.regime in [MarketRegime.TRENDING_UP, MarketRegime.TRENDING_DOWN]:
            # Boost in strong trends, but cap it
            trend_boost = min(regime.trend_strength, 0.3)  # Max 30% boost
            regime_multiplier *= (1.0 + trend_boost)

        return base_size * regime_multiplier * confidence_adjustment

    def _apply_risk_adjustments(self, base_size: float, risk_metrics: RiskMetrics,
                               current_positions: List[Dict], symbol: str) -> float:
        """Apply comprehensive risk adjustments to position size."""

        adjusted_size = base_size

        # Drawdown adjustment - reduce size during drawdowns
        if risk_metrics.current_drawdown > 0.05:  # 5% drawdown
            drawdown_reduction = max(0.3, 1.0 - (risk_metrics.current_drawdown * 2))
            adjusted_size *= drawdown_reduction

        # Sharpe ratio adjustment
        if risk_metrics.sharpe_ratio < 0.5:  # Poor risk-adjusted returns
            sharpe_reduction = max(0.5, risk_metrics.sharpe_ratio * 2)
            adjusted_size *= sharpe_reduction

        # Portfolio concentration check
        total_portfolio_exposure = sum(abs(p.get('size', 0)) for p in current_positions)
        if total_portfolio_exposure > 0.8:  # Over 80% utilized
            concentration_reduction = 0.7
            adjusted_size *= concentration_reduction

        # Symbol-specific correlation risk
        correlation_risk = self._calculate_symbol_correlation_risk(symbol, current_positions)
        if correlation_risk > 0.7:  # Highly correlated
            correlation_penalty = max(0.3, 1.0 - correlation_risk)
            adjusted_size *= correlation_penalty

        return adjusted_size

    def _calculate_symbol_correlation_risk(self, symbol: str, current_positions: List[Dict]) -> float:
        """Calculate correlation risk for a symbol against current positions using advanced correlation analysis."""

        try:
            from .trade_correlation import get_correlation_analyzer
            analyzer = await get_correlation_analyzer()

            # Get correlation-based risk assessment
            correlation_risk = analyzer.get_symbol_correlation_risk(symbol)

            # Get portfolio correlation analysis
            portfolio_risk = analyzer.analyze_portfolio_correlation_risk(current_positions)

            # Combine symbol-specific and portfolio-level correlation risk
            symbol_risk_score = correlation_risk['correlation_risk']
            portfolio_risk_score = portfolio_risk.risk_concentration_score

            # Weight the combination (60% symbol-specific, 40% portfolio-level)
            combined_risk = (symbol_risk_score * 0.6) + (portfolio_risk_score * 0.4)

            # Apply risk-adjusted limit from portfolio analysis
            risk_adjusted_limit = portfolio_risk.risk_adjusted_limits.get(symbol, 1.0)

            return min(combined_risk, 1.0)

        except Exception:
            # Fallback to simplified calculation
            symbol_positions = [p for p in current_positions if p.get('symbol') == symbol]
            if not symbol_positions:
                return 0.0

            total_exposure = sum(abs(p.get('size', 0)) for p in current_positions)
            symbol_exposure = sum(abs(p.get('size', 0)) for p in symbol_positions)

            if total_exposure == 0:
                return 0.0

            concentration_ratio = symbol_exposure / total_exposure
            return min(concentration_ratio * 2, 1.0)  # Scale and cap at 1.0

    def _apply_signal_adjustments(self, base_size: float, signal_strength: float,
                                confidence: float) -> float:
        """Apply adjustments based on signal quality."""

        # Signal strength scaling (assuming signal_strength is in 0-10 range)
        signal_multiplier = min(signal_strength / 5.0, 2.0)  # Max 2x boost

        # Confidence scaling
        confidence_multiplier = 0.5 + (confidence * 0.5)  # 0.5 to 1.0

        return base_size * signal_multiplier * confidence_multiplier

    def _apply_bounds_and_limits(self, size: float, risk_metrics: RiskMetrics) -> float:
        """Apply final bounds and regulatory limits."""

        # Absolute bounds
        size = max(self.min_position_size, min(size, self.max_portfolio_risk))

        # Emergency risk reduction during extreme conditions
        if risk_metrics.current_drawdown > 0.15:  # 15% drawdown
            size *= 0.5
        elif risk_metrics.volatility_24h > 0.3:  # 30% volatility
            size *= 0.7

        # Regulatory limits (simplified)
        size = min(size, 0.1)  # Max 10% per position

        return size

    def _calculate_confidence_interval(self, size: float, confidence: float) -> Tuple[float, float]:
        """Calculate confidence interval for position size estimate."""

        # Simplified confidence interval based on signal confidence
        margin = size * (1 - confidence) * 0.5
        return (max(0, size - margin), size + margin)

    def _generate_sizing_reasoning(self, sizing_decision: Dict) -> str:
        """Generate human-readable reasoning for sizing decision."""

        reasons = []

        if sizing_decision['regime'] != 'unknown':
            reasons.append(f"Regime: {sizing_decision['regime']}")

        risk_metrics = sizing_decision['risk_metrics']
        if risk_metrics['drawdown'] > 0.05:
            reasons.append(f"Drawdown protection: {risk_metrics['drawdown']:.1%}")

        if risk_metrics['volatility'] > 0.2:
            reasons.append(f"Volatility adjustment: {risk_metrics['volatility']:.1%}")

        if not reasons:
            reasons.append("Standard Kelly criterion with confidence adjustment")

        return "; ".join(reasons)

    def update_trade_result(self, trade_result: Dict):
        """Update position sizer with trade results for learning."""

        self.trade_history.append(trade_result)

        # Keep only recent trades for performance calculation
        if len(self.trade_history) > 1000:
            self.trade_history = self.trade_history[-1000:]

        # Update daily returns if applicable
        if 'daily_pnl' in trade_result:
            daily_return = trade_result['daily_pnl'] / trade_result.get('portfolio_value', 1.0)
            self.daily_returns.append(daily_return)

            if len(self.daily_returns) > 365:
                self.daily_returns = self.daily_returns[-365:]

    def get_sizing_stats(self) -> Dict:
        """Get comprehensive position sizing statistics."""

        if not self.sizing_history:
            return {"total_decisions": 0}

        recent_decisions = self.sizing_history[-100:] if len(self.sizing_history) >= 100 else self.sizing_history

        avg_size = statistics.mean(d['final_size'] for d in recent_decisions)
        size_volatility = statistics.stdev(d['final_size'] for d in recent_decisions) if len(recent_decisions) > 1 else 0

        return {
            "total_decisions": len(self.sizing_history),
            "avg_position_size": avg_size,
            "size_volatility": size_volatility,
            "regime_distribution": self._get_regime_distribution(recent_decisions),
            "risk_adjustment_avg": statistics.mean(d['risk_adjusted_size'] / d['kelly_size'] if d['kelly_size'] > 0 else 1.0
                                                 for d in recent_decisions)
        }

    def _get_regime_distribution(self, decisions: List[Dict]) -> Dict[str, int]:
        """Get distribution of sizing decisions by regime."""

        regime_counts = {}
        for decision in decisions:
            regime = decision.get('regime', 'unknown')
            regime_counts[regime] = regime_counts.get(regime, 0) + 1

        return regime_counts


# Global position sizer instance
_adaptive_position_sizer: Optional[AdaptivePositionSizer] = None


async def get_adaptive_position_sizer() -> AdaptivePositionSizer:
    """Get global adaptive position sizer instance."""
    global _adaptive_position_sizer
    if _adaptive_position_sizer is None:
        _adaptive_position_sizer = AdaptivePositionSizer()
    return _adaptive_position_sizer
