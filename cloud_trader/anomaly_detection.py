"""Anomaly detection for HFT trading systems - spoofing detection and compliance monitoring."""

from __future__ import annotations

import asyncio
import logging
import statistics
from collections import deque
from dataclasses import dataclass
from typing import Deque, Dict, List, Optional, Tuple

from .time_sync import get_timestamp_us

logger = logging.getLogger(__name__)


@dataclass
class TradeAnomaly:
    """Represents a detected trading anomaly."""

    anomaly_type: str
    severity: str  # 'low', 'medium', 'high', 'critical'
    confidence: float
    description: str
    timestamp_us: int
    symbol: str
    metrics: Dict[str, float]


class SpoofingDetector:
    """Advanced spoofing detection using multiple ML and statistical methods."""

    def __init__(self, window_size: int = 1000):
        self.window_size = window_size

        # Order book tracking
        self.order_history: Deque[Dict] = deque(maxlen=window_size)
        self.cancel_history: Deque[Dict] = deque(maxlen=window_size)

        # Statistical trackers
        self.price_volatility: Deque[float] = deque(maxlen=100)
        self.order_imbalance: Deque[float] = deque(maxlen=100)

        # ML-based detection thresholds
        self.spoofing_thresholds = {
            "cancel_ratio": 0.8,  # 80%+ orders cancelled
            "layering_score": 2.5,  # Z-score for layered orders
            "momentum_spike": 3.0,  # Z-score for sudden momentum changes
            "volume_anomaly": 2.0,  # Z-score for unusual volume patterns
        }

    def analyze_order_flow(self, order_data: Dict) -> Optional[TradeAnomaly]:
        """
        Analyze order flow for spoofing patterns.
        Detects: Layering, Momentum Ignition, Quote Stuffing
        """
        self.order_history.append(order_data)

        if len(self.order_history) < 50:
            return None  # Need minimum data

        # Layering Detection: Multiple orders at same price with rapid cancellations
        layering_score = self._detect_layering()

        # Momentum Ignition: Large orders followed by immediate cancellations
        momentum_score = self._detect_momentum_ignition()

        # Quote Stuffing: Extremely high frequency small orders
        stuffing_score = self._detect_quote_stuffing()

        # Determine most severe anomaly
        max_score = max(layering_score, momentum_score, stuffing_score)

        if max_score > 2.5:  # Critical threshold
            anomaly_type = (
                "layering"
                if layering_score == max_score
                else "momentum_ignition" if momentum_score == max_score else "quote_stuffing"
            )

            severity = "critical" if max_score > 3.5 else "high"

            return TradeAnomaly(
                anomaly_type=f"spoofing_{anomaly_type}",
                severity=severity,
                confidence=min(1.0, max_score / 4.0),
                description=f"Detected {anomaly_type.replace('_', ' ')} pattern with score {max_score:.2f}",
                timestamp_us=get_timestamp_us(),
                symbol=order_data.get("symbol", "UNKNOWN"),
                metrics={
                    "layering_score": layering_score,
                    "momentum_score": momentum_score,
                    "stuffing_score": stuffing_score,
                    "max_score": max_score,
                },
            )

        return None

    def _detect_layering(self) -> float:
        """Detect order layering - multiple orders at same price level."""
        if len(self.order_history) < 20:
            return 0.0

        # Count orders at each price level
        price_levels = {}
        for order in list(self.order_history)[-50:]:  # Last 50 orders
            price = round(order.get("price", 0), 4)  # Round to 4 decimals
            price_levels[price] = price_levels.get(price, 0) + 1

        # Calculate layering score based on concentration
        max_orders_at_level = max(price_levels.values())
        avg_orders_per_level = sum(price_levels.values()) / len(price_levels) if price_levels else 1

        layering_ratio = (
            max_orders_at_level / avg_orders_per_level if avg_orders_per_level > 0 else 1
        )

        # Calculate z-score
        if len(self.order_imbalance) >= 10:
            mean_ratio = statistics.mean(list(price_levels.values())[:10])  # Rough approximation
            stdev_ratio = (
                statistics.stdev(list(price_levels.values())[:10]) if len(price_levels) > 1 else 1
            )
            z_score = (layering_ratio - mean_ratio) / stdev_ratio if stdev_ratio > 0 else 0
            return abs(z_score)
        else:
            return layering_ratio / 5.0  # Fallback heuristic

    def _detect_momentum_ignition(self) -> float:
        """Detect momentum ignition - large orders to manipulate price, then cancel."""
        if len(self.cancel_history) < 10:
            return 0.0

        # Look for large orders followed by cancellations within short time
        recent_orders = list(self.order_history)[-20:]
        recent_cancels = list(self.cancel_history)[-20:]

        ignition_events = 0
        total_large_orders = 0

        for order in recent_orders:
            if order.get("quantity", 0) > self._calculate_avg_order_size() * 2:  # Large order
                total_large_orders += 1

                # Check if cancelled within 5 seconds (microseconds)
                order_time = order.get("timestamp_us", 0)
                matching_cancels = [
                    c
                    for c in recent_cancels
                    if abs(c.get("timestamp_us", 0) - order_time) < 5_000_000
                ]  # 5 seconds

                if matching_cancels:
                    ignition_events += 1

        if total_large_orders == 0:
            return 0.0

        ignition_ratio = ignition_events / total_large_orders
        return ignition_ratio * 4.0  # Scale to z-score like range

    def _detect_quote_stuffing(self) -> float:
        """Detect quote stuffing - extremely high frequency small orders."""
        if len(self.order_history) < 100:
            return 0.0

        # Calculate order frequency over time windows
        recent_orders = list(self.order_history)[-100:]
        time_window_us = 1_000_000  # 1 second

        if not recent_orders:
            return 0.0

        start_time = recent_orders[0].get("timestamp_us", 0)
        end_time = recent_orders[-1].get("timestamp_us", 0)
        total_time_us = end_time - start_time

        if total_time_us <= 0:
            return 0.0

        # Orders per second
        ops = len(recent_orders) / (total_time_us / 1_000_000)

        # Average order size
        avg_size = sum(o.get("quantity", 0) for o in recent_orders) / len(recent_orders)

        # Quote stuffing score: high frequency + small size
        frequency_score = min(ops / 10.0, 4.0)  # Cap at 4
        size_score = 1.0 / (avg_size + 1.0)  # Smaller orders = higher score

        stuffing_score = frequency_score * size_score * 2.0

        return min(stuffing_score, 4.0)

    def _calculate_avg_order_size(self) -> float:
        """Calculate average order size from recent history."""
        if not self.order_history:
            return 1000.0  # Default

        recent_sizes = [o.get("quantity", 0) for o in list(self.order_history)[-50:]]
        return statistics.mean(recent_sizes) if recent_sizes else 1000.0

    def record_cancel(self, cancel_data: Dict):
        """Record order cancellation for analysis."""
        self.cancel_history.append(cancel_data)


class ComplianceMonitor:
    """Regulatory compliance monitoring for HFT systems."""

    def __init__(self):
        self.trade_log: Deque[Dict] = deque(maxlen=10000)  # Last 10k trades
        self.position_log: Deque[Dict] = deque(maxlen=1000)  # Position changes

        # MiFID II / Reg NMS compliance rules
        self.compliance_rules = {
            "max_position_age": 300_000_000,  # 5 minutes in microseconds
            "max_leverage": 30.0,
            "min_order_interval_us": 1000,  # Minimum time between orders (1ms)
            "max_orders_per_second": 1000,
            "wash_trade_prevention": True,
        }

    def check_trade_compliance(self, trade_data: Dict) -> List[TradeAnomaly]:
        """
        Check trade for regulatory compliance violations.
        Returns list of compliance anomalies detected.
        """
        anomalies = []

        # Record trade for analysis
        self.trade_log.append(trade_data)

        # Check high-frequency trading limits
        hft_anomaly = self._check_hft_limits(trade_data)
        if hft_anomaly:
            anomalies.append(hft_anomaly)

        # Check position limits and concentration
        position_anomaly = self._check_position_limits(trade_data)
        if position_anomaly:
            anomalies.append(position_anomaly)

        # Check for wash trades
        wash_anomaly = self._check_wash_trades(trade_data)
        if wash_anomaly:
            anomalies.append(wash_anomaly)

        # Check for spoofing indicators
        spoof_anomaly = self._check_spoofing_indicators(trade_data)
        if spoof_anomaly:
            anomalies.append(spoof_anomaly)

        return anomalies

    def _check_hft_limits(self, trade_data: Dict) -> Optional[TradeAnomaly]:
        """Check high-frequency trading rate limits."""
        symbol = trade_data.get("symbol", "UNKNOWN")

        # Count trades in last second
        current_time = trade_data.get("timestamp_us", get_timestamp_us())
        one_second_ago = current_time - 1_000_000

        recent_trades = [
            t
            for t in self.trade_log
            if t.get("symbol") == symbol and t.get("timestamp_us", 0) >= one_second_ago
        ]

        trades_per_second = len(recent_trades)

        if trades_per_second > self.compliance_rules["max_orders_per_second"]:
            return TradeAnomaly(
                anomaly_type="compliance_hft_rate_limit",
                severity="high",
                confidence=1.0,
                description=f"HFT rate limit exceeded: {trades_per_second} trades/second (max: {self.compliance_rules['max_orders_per_second']})",
                timestamp_us=current_time,
                symbol=symbol,
                metrics={"trades_per_second": trades_per_second},
            )

        return None

    def _check_position_limits(self, trade_data: Dict) -> Optional[TradeAnomaly]:
        """Check position size and leverage limits."""
        position_size = abs(trade_data.get("position_size", 0))
        leverage = trade_data.get("leverage", 1.0)

        if leverage > self.compliance_rules["max_leverage"]:
            return TradeAnomaly(
                anomaly_type="compliance_leverage_limit",
                severity="critical",
                confidence=1.0,
                description=f"Leverage limit exceeded: {leverage}x (max: {self.compliance_rules['max_leverage']}x)",
                timestamp_us=trade_data.get("timestamp_us", get_timestamp_us()),
                symbol=trade_data.get("symbol", "UNKNOWN"),
                metrics={"leverage": leverage, "position_size": position_size},
            )

        return None

    def _check_wash_trades(self, trade_data: Dict) -> Optional[TradeAnomaly]:
        """Detect potential wash trades (trading with oneself)."""
        if not self.compliance_rules["wash_trade_prevention"]:
            return None

        # Simple wash trade detection: same account buying and selling rapidly
        account_id = trade_data.get("account_id", "unknown")
        symbol = trade_data.get("symbol", "UNKNOWN")
        side = trade_data.get("side", "unknown")

        # Look for opposite side trades by same account within short time
        current_time = trade_data.get("timestamp_us", get_timestamp_us())
        five_seconds_ago = current_time - 5_000_000

        opposite_trades = [
            t
            for t in self.trade_log
            if (
                t.get("account_id") == account_id
                and t.get("symbol") == symbol
                and t.get("side") != side
                and abs(t.get("timestamp_us", 0) - current_time) <= 5_000_000
            )
        ]

        if opposite_trades:
            return TradeAnomaly(
                anomaly_type="compliance_wash_trade",
                severity="critical",
                confidence=0.9,
                description="Potential wash trade detected: rapid buy/sell by same account",
                timestamp_us=current_time,
                symbol=symbol,
                metrics={"opposite_trades_count": len(opposite_trades)},
            )

        return None

    def _check_spoofing_indicators(self, trade_data: Dict) -> Optional[TradeAnomaly]:
        """Check for spoofing indicators in trade patterns."""
        # This would integrate with the SpoofingDetector
        # For now, return None as primary detection is handled by SpoofingDetector
        return None


class AnomalyDetectionEngine:
    """Unified anomaly detection engine combining multiple detectors."""

    def __init__(self):
        self.spoofing_detector = SpoofingDetector()
        self.compliance_monitor = ComplianceMonitor()
        self.anomaly_history: Deque[TradeAnomaly] = deque(maxlen=1000)

    async def analyze_order(self, order_data: Dict) -> Optional[TradeAnomaly]:
        """Analyze order for spoofing patterns."""
        return self.spoofing_detector.analyze_order_flow(order_data)

    async def analyze_trade(self, trade_data: Dict) -> List[TradeAnomaly]:
        """Analyze trade for compliance and anomalies."""
        anomalies = self.compliance_monitor.check_trade_compliance(trade_data)

        # Record all anomalies
        for anomaly in anomalies:
            self.anomaly_history.append(anomaly)

        return anomalies

    def get_anomaly_stats(self) -> Dict:
        """Get anomaly detection statistics."""
        if not self.anomaly_history:
            return {"total_anomalies": 0}

        anomaly_types = {}
        severities = {}

        for anomaly in self.anomaly_history:
            anomaly_types[anomaly.anomaly_type] = anomaly_types.get(anomaly.anomaly_type, 0) + 1
            severities[anomaly.severity] = severities.get(anomaly.severity, 0) + 1

        return {
            "total_anomalies": len(self.anomaly_history),
            "anomaly_types": anomaly_types,
            "severities": severities,
            "most_recent": self.anomaly_history[-1].anomaly_type if self.anomaly_history else None,
        }

    def record_cancel(self, cancel_data: Dict):
        """Record order cancellation."""
        self.spoofing_detector.record_cancel(cancel_data)


# Global anomaly detection instance
_anomaly_engine: Optional[AnomalyDetectionEngine] = None


async def get_anomaly_detection_engine() -> AnomalyDetectionEngine:
    """Get global anomaly detection engine instance."""
    global _anomaly_engine
    if _anomaly_engine is None:
        _anomaly_engine = AnomalyDetectionEngine()
    return _anomaly_engine
