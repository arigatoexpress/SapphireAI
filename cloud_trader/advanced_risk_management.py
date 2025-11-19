"""
Advanced risk management with portfolio-level controls and market risk assessment.
"""

import asyncio
import logging
import numpy as np
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from enum import Enum

logger = logging.getLogger(__name__)

class RiskLevel(Enum):
    """Risk assessment levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

@dataclass
class PortfolioRiskMetrics:
    """Comprehensive portfolio risk metrics."""
    total_exposure: float = 0.0
    max_drawdown: float = 0.0
    sharpe_ratio: float = 0.0
    sortino_ratio: float = 0.0
    value_at_risk_95: float = 0.0
    expected_shortfall_95: float = 0.0
    beta: float = 1.0
    correlation_matrix: Dict[Tuple[str, str], float] = field(default_factory=dict)
    concentration_risk: float = 0.0
    liquidity_risk: float = 0.0
    volatility_risk: float = 0.0

@dataclass
class MarketRiskAssessment:
    """Market-wide risk assessment."""
    market_volatility: float = 0.0
    market_trend: str = "neutral"
    sector_correlations: Dict[str, float] = field(default_factory=dict)
    systemic_risk_score: float = 0.0
    liquidity_conditions: str = "normal"
    timestamp: datetime = field(default_factory=datetime.now)

class AdvancedRiskManager:
    """Advanced risk management with portfolio and market risk controls."""

    def __init__(self, max_portfolio_risk: float = 0.02, max_correlation: float = 0.8):
        self.max_portfolio_risk = max_portfolio_risk
        self.max_correlation = max_correlation
        self.portfolio_history: List[Dict[str, Any]] = []
        self.risk_limits = {
            'max_drawdown': 0.25,  # 25% max drawdown
            'max_concentration': 0.15,  # 15% max single position
            'max_sector_exposure': 0.30,  # 30% max sector exposure
            'max_volatility': 0.05,  # 5% max portfolio volatility
            'min_liquidity': 0.70,  # 70% min liquid positions
            'max_leverage': 2.0,  # 2x max leverage
            'max_var': 0.10,  # 10% max VaR
        }

    async def assess_portfolio_risk(self, positions: Dict[str, Any], market_data: Dict[str, Any]) -> PortfolioRiskMetrics:
        """Comprehensive portfolio risk assessment."""
        metrics = PortfolioRiskMetrics()

        try:
            # Calculate basic exposure
            total_exposure = sum(abs(pos['notional']) for pos in positions.values())
            metrics.total_exposure = total_exposure

            # Calculate drawdown
            if self.portfolio_history:
                peak_value = max(h['portfolio_value'] for h in self.portfolio_history[-30:])  # Last 30 days
                current_value = sum(pos.get('current_value', pos['notional']) for pos in positions.values())
                metrics.max_drawdown = (peak_value - current_value) / peak_value if peak_value > 0 else 0

            # Calculate risk metrics
            returns = self._calculate_returns_history()
            if returns:
                metrics.sharpe_ratio = self._calculate_sharpe_ratio(returns)
                metrics.sortino_ratio = self._calculate_sortino_ratio(returns)
                metrics.value_at_risk_95 = self._calculate_var(returns, 0.95)
                metrics.expected_shortfall_95 = self._calculate_expected_shortfall(returns, 0.95)

            # Calculate correlation matrix
            metrics.correlation_matrix = self._calculate_correlation_matrix(positions, market_data)

            # Assess concentration risk
            metrics.concentration_risk = self._assess_concentration_risk(positions)

            # Assess liquidity risk
            metrics.liquidity_risk = self._assess_liquidity_risk(positions, market_data)

            # Assess volatility risk
            metrics.volatility_risk = self._assess_volatility_risk(positions, market_data)

            # Calculate beta
            metrics.beta = self._calculate_portfolio_beta(positions, market_data)

        except Exception as e:
            logger.error(f"Error assessing portfolio risk: {e}")
            # Return safe defaults
            metrics.max_drawdown = 0.0

        return metrics

    async def assess_market_risk(self, market_data: Dict[str, Any]) -> MarketRiskAssessment:
        """Assess market-wide risk conditions."""
        assessment = MarketRiskAssessment()

        try:
            # Calculate market volatility
            prices = [data.get('price', 0) for data in market_data.values()]
            if len(prices) > 1:
                returns = np.diff(np.log(prices))
                assessment.market_volatility = np.std(returns) * np.sqrt(252)  # Annualized

            # Determine market trend
            if prices:
                recent_trend = np.polyfit(range(len(prices)), prices, 1)[0]
                if recent_trend > 0.001:
                    assessment.market_trend = "bullish"
                elif recent_trend < -0.001:
                    assessment.market_trend = "bearish"
                else:
                    assessment.market_trend = "neutral"

            # Assess systemic risk (simplified)
            high_vol_assets = sum(1 for data in market_data.values()
                                if data.get('volatility', 0) > assessment.market_volatility)
            assessment.systemic_risk_score = high_vol_assets / len(market_data) if market_data else 0

            # Assess liquidity conditions
            avg_volume = np.mean([data.get('volume', 0) for data in market_data.values()])
            if avg_volume > 1000000:  # High liquidity
                assessment.liquidity_conditions = "excellent"
            elif avg_volume > 100000:
                assessment.liquidity_conditions = "good"
            elif avg_volume > 10000:
                assessment.liquidity_conditions = "moderate"
            else:
                assessment.liquidity_conditions = "poor"

        except Exception as e:
            logger.error(f"Error assessing market risk: {e}")

        return assessment

    def check_risk_limits(self, risk_metrics: PortfolioRiskMetrics, market_risk: MarketRiskAssessment) -> List[str]:
        """Check if portfolio exceeds risk limits."""
        violations = []

        # Portfolio-level limits
        if risk_metrics.max_drawdown > self.risk_limits['max_drawdown']:
            violations.append(f"Drawdown limit exceeded: {risk_metrics.max_drawdown:.1%} > {self.risk_limits['max_drawdown']:.1%}")

        if risk_metrics.concentration_risk > self.risk_limits['max_concentration']:
            violations.append(f"Concentration risk too high: {risk_metrics.concentration_risk:.1%}")

        if risk_metrics.volatility_risk > self.risk_limits['max_volatility']:
            violations.append(f"Portfolio volatility too high: {risk_metrics.volatility_risk:.1%}")

        if risk_metrics.value_at_risk_95 > self.risk_limits['max_var']:
            violations.append(f"VaR limit exceeded: {risk_metrics.value_at_risk_95:.1%}")

        if risk_metrics.liquidity_risk < self.risk_limits['min_liquidity']:
            violations.append(f"Liquidity risk too high: {risk_metrics.liquidity_risk:.1%}")

        # Market condition adjustments
        if market_risk.market_volatility > 0.05 and risk_metrics.volatility_risk > self.risk_limits['max_volatility'] * 0.8:
            violations.append("High market volatility - reducing position limits")

        if market_risk.systemic_risk_score > 0.7:
            violations.append("High systemic risk detected - reducing exposure")

        return violations

    async def get_dynamic_position_limits(self, risk_metrics: PortfolioRiskMetrics, market_risk: MarketRiskAssessment) -> Dict[str, float]:
        """Calculate dynamic position limits based on current risk."""
        base_limits = {
            'max_position_size': 0.05,  # 5% of portfolio
            'max_leverage': 2.0,
            'max_concentration': 0.15,
        }

        # Adjust limits based on risk conditions
        risk_multiplier = 1.0

        # Increase caution in high-risk conditions
        if risk_metrics.volatility_risk > 0.03:
            risk_multiplier *= 0.7
        if market_risk.systemic_risk_score > 0.5:
            risk_multiplier *= 0.8
        if risk_metrics.max_drawdown > 0.10:
            risk_multiplier *= 0.6

        # Decrease caution in low-risk conditions
        if risk_metrics.volatility_risk < 0.01 and market_risk.systemic_risk_score < 0.3:
            risk_multiplier *= 1.2

        # Apply limits
        dynamic_limits = {}
        for key, base_value in base_limits.items():
            dynamic_limits[key] = base_value * risk_multiplier

        return dynamic_limits

    def should_halt_trading(self, risk_metrics: PortfolioRiskMetrics, violations: List[str]) -> bool:
        """Determine if trading should be halted due to risk."""
        critical_violations = [v for v in violations if any(word in v.lower() for word in ['critical', 'exceeded', 'too high'])]

        # Halt if multiple critical violations or extreme drawdown
        if len(critical_violations) >= 2:
            return True

        if risk_metrics.max_drawdown > 0.30:  # 30% drawdown
            return True

        if risk_metrics.value_at_risk_95 > 0.15:  # 15% VaR
            return True

        return False

    def _calculate_returns_history(self) -> List[float]:
        """Calculate historical returns for risk metrics."""
        if len(self.portfolio_history) < 2:
            return []

        returns = []
        for i in range(1, len(self.portfolio_history)):
            prev_value = self.portfolio_history[i-1]['portfolio_value']
            curr_value = self.portfolio_history[i]['portfolio_value']
            if prev_value > 0:
                returns.append((curr_value - prev_value) / prev_value)

        return returns

    def _calculate_sharpe_ratio(self, returns: List[float], risk_free_rate: float = 0.02) -> float:
        """Calculate Sharpe ratio."""
        if not returns:
            return 0.0

        avg_return = np.mean(returns)
        std_return = np.std(returns)

        if std_return == 0:
            return 0.0

        return (avg_return - risk_free_rate) / std_return * np.sqrt(252)  # Annualized

    def _calculate_sortino_ratio(self, returns: List[float], risk_free_rate: float = 0.02) -> float:
        """Calculate Sortino ratio (downside deviation only)."""
        if not returns:
            return 0.0

        avg_return = np.mean(returns)
        downside_returns = [r for r in returns if r < 0]
        downside_std = np.std(downside_returns) if downside_returns else 0

        if downside_std == 0:
            return 0.0

        return (avg_return - risk_free_rate) / downside_std * np.sqrt(252)

    def _calculate_var(self, returns: List[float], confidence: float = 0.95) -> float:
        """Calculate Value at Risk."""
        if not returns:
            return 0.0

        return abs(np.percentile(returns, (1 - confidence) * 100))

    def _calculate_expected_shortfall(self, returns: List[float], confidence: float = 0.95) -> float:
        """Calculate Expected Shortfall (Conditional VaR)."""
        if not returns:
            return 0.0

        var = self._calculate_var(returns, confidence)
        tail_losses = [r for r in returns if r <= -var]

        return abs(np.mean(tail_losses)) if tail_losses else var

    def _calculate_correlation_matrix(self, positions: Dict[str, Any], market_data: Dict[str, Any]) -> Dict[Tuple[str, str], float]:
        """Calculate correlation matrix for portfolio positions."""
        # Simplified correlation calculation
        correlations = {}

        symbols = list(positions.keys())
        for i, symbol1 in enumerate(symbols):
            for symbol2 in symbols[i+1:]:
                # Use market data to estimate correlation
                corr_key = (symbol1, symbol2)
                # Simplified: assume moderate correlation
                correlations[corr_key] = 0.3  # Could be calculated from historical data

        return correlations

    def _assess_concentration_risk(self, positions: Dict[str, Any]) -> float:
        """Assess portfolio concentration risk."""
        if not positions:
            return 0.0

        total_value = sum(abs(pos.get('current_value', pos['notional'])) for pos in positions.values())
        if total_value == 0:
            return 0.0

        max_position = max(abs(pos.get('current_value', pos['notional'])) for pos in positions.values())
        return max_position / total_value

    def _assess_liquidity_risk(self, positions: Dict[str, Any], market_data: Dict[str, Any]) -> float:
        """Assess portfolio liquidity risk."""
        if not positions:
            return 1.0  # Fully liquid if no positions

        liquid_positions = 0
        total_positions = len(positions)

        for symbol, position in positions.items():
            market_info = market_data.get(symbol, {})
            volume = market_info.get('volume', 0)
            notional = abs(position.get('current_value', position['notional']))

            # Consider liquid if daily volume > position size
            if volume > notional:
                liquid_positions += 1

        return liquid_positions / total_positions if total_positions > 0 else 1.0

    def _assess_volatility_risk(self, positions: Dict[str, Any], market_data: Dict[str, Any]) -> float:
        """Assess portfolio volatility risk."""
        if not positions:
            return 0.0

        volatilities = []
        for symbol in positions.keys():
            market_info = market_data.get(symbol, {})
            volatility = market_info.get('volatility', 0.02)  # Default 2%
            volatilities.append(volatility)

        # Portfolio volatility (simplified weighted average)
        return np.mean(volatilities) if volatilities else 0.0

    def _calculate_portfolio_beta(self, positions: Dict[str, Any], market_data: Dict[str, Any]) -> float:
        """Calculate portfolio beta."""
        # Simplified beta calculation
        betas = []
        for symbol in positions.keys():
            # Most crypto assets have beta around 1.0-2.0 vs BTC
            betas.append(1.5)  # Simplified

        return np.mean(betas) if betas else 1.0

    async def log_risk_assessment(self, risk_metrics: PortfolioRiskMetrics, market_risk: MarketRiskAssessment, violations: List[str]):
        """Log comprehensive risk assessment."""
        logger.info("=== RISK ASSESSMENT ===")
        logger.info(f"Portfolio Exposure: ${risk_metrics.total_exposure:,.2f}")
        logger.info(f"Max Drawdown: {risk_metrics.max_drawdown:.1%}")
        logger.info(f"Sharpe Ratio: {risk_metrics.sharpe_ratio:.2f}")
        logger.info(f"VaR (95%): {risk_metrics.value_at_risk_95:.1%}")
        logger.info(f"Concentration Risk: {risk_metrics.concentration_risk:.1%}")
        logger.info(f"Liquidity Risk: {risk_metrics.liquidity_risk:.1%}")
        logger.info(f"Volatility Risk: {risk_metrics.volatility_risk:.1%}")

        logger.info(f"Market Volatility: {market_risk.market_volatility:.1%}")
        logger.info(f"Market Trend: {market_risk.market_trend}")
        logger.info(f"Systemic Risk Score: {market_risk.systemic_risk_score:.1%}")

        if violations:
            logger.warning(f"Risk Violations: {len(violations)}")
            for violation in violations:
                logger.warning(f"  - {violation}")
        else:
            logger.info("No risk limit violations detected")

# Global risk manager instance
_advanced_risk_manager: Optional[AdvancedRiskManager] = None

def get_advanced_risk_manager() -> AdvancedRiskManager:
    """Get the global advanced risk manager instance."""
    global _advanced_risk_manager
    if _advanced_risk_manager is None:
        _advanced_risk_manager = AdvancedRiskManager()
    return _advanced_risk_manager
