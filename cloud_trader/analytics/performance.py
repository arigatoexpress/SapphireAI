"""
Performance Analytics Module for Aster Self-Learning Agents.
Tracks Sharpe Ratio, Sortino Ratio, Win Rate, and Alpha relative to Benchmark.
"""

import json
import logging
import math
import os
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)


@dataclass
class AgentMetrics:
    agent_id: str
    total_trades: int = 0
    wins: int = 0
    losses: int = 0
    total_pnl: float = 0.0
    equity_curve: List[float] = field(default_factory=list)
    timestamps: List[float] = field(default_factory=list)
    returns_history: List[float] = field(default_factory=list)
    max_drawdown: float = 0.0
    peak_equity: float = 0.0
    win_rate: float = 0.0
    sharpe_ratio: float = 0.0
    sortino_ratio: float = 0.0
    profit_factor: float = 0.0
    average_win: float = 0.0
    average_loss: float = 0.0
    last_updated: float = 0.0


class PerformanceTracker:
    def __init__(self, storage_path: str = "/tmp/logs/agent_performance.json"):
        self.storage_path = storage_path
        self.metrics: Dict[str, AgentMetrics] = {}
        self.risk_free_rate = 0.02  # 2% annual risk free
        self._load_metrics()

    def _load_metrics(self):
        """Load metrics from disk."""
        if os.path.exists(self.storage_path):
            try:
                with open(self.storage_path, "r") as f:
                    data = json.load(f)
                    for agent_id, m_data in data.items():
                        self.metrics[agent_id] = AgentMetrics(**m_data)
                logger.info(f"Loaded performance metrics for {len(self.metrics)} agents")
            except Exception as e:
                logger.error(f"Failed to load metrics: {e}")

    def save_metrics(self):
        """Save metrics to disk."""
        try:
            os.makedirs(os.path.dirname(self.storage_path), exist_ok=True)
            data = {k: v.__dict__ for k, v in self.metrics.items()}
            with open(self.storage_path, "w") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save metrics: {e}")

    def record_trade(self, agent_id: str, pnl: float, capital_used: float = 1000.0):
        """Record a completed trade for an agent."""
        if agent_id not in self.metrics:
            self.metrics[agent_id] = AgentMetrics(agent_id=agent_id)

        m = self.metrics[agent_id]
        m.total_trades += 1
        m.total_pnl += pnl
        m.timestamps.append(time.time())

        # Update Equity Curve (simplified relative to initial capital)
        # Using a base of 0 for PnL steps
        current_equity = m.total_pnl
        m.equity_curve.append(current_equity)

        # Track Returns %
        if capital_used > 0:
            ret_pct = pnl / capital_used
            m.returns_history.append(ret_pct)

        # Win/Loss Stats
        if pnl > 0:
            m.wins += 1
        elif pnl < 0:
            m.losses += 1

        # Drawdown logic
        if current_equity > m.peak_equity:
            m.peak_equity = current_equity
        drawdown = m.peak_equity - current_equity
        if drawdown > m.max_drawdown:
            m.max_drawdown = drawdown

        # Ratios
        self._recalculate_ratios(m)

        m.last_updated = time.time()
        self.save_metrics()

    def _recalculate_ratios(self, m: AgentMetrics):
        """Calculate advanced metrics."""
        # Win Rate
        if m.total_trades > 0:
            m.win_rate = m.wins / m.total_trades

        # Profit Factor
        gross_loss = abs(
            sum([x for x in self._get_pnl_history(m) if x < 0]) or 1.0
        )  # Avoid div by zero
        gross_win = sum([x for x in self._get_pnl_history(m) if x > 0])
        m.profit_factor = gross_win / gross_loss if gross_loss > 0 else float("inf")

        # Returns for Sharpe/Sortino
        returns = self._get_returns_series(m)
        if len(returns) > 1:
            avg_return = sum(returns) / len(returns)
            std_dev = self._std_dev(returns)

            # Sharpe (Annualized approx assuming daily trades, simplified)
            if std_dev > 0:
                m.sharpe_ratio = (avg_return) / std_dev * math.sqrt(365)

            # Sortino
            negative_returns = [r for r in returns if r < 0]
            downside_dev = self._std_dev(negative_returns) if negative_returns else 1.0
            if downside_dev > 0:
                # Penalize only downside
                m.sortino_ratio = (avg_return) / downside_dev * math.sqrt(365)

    def _get_pnl_history(self, m: AgentMetrics) -> List[float]:
        """Reconstruct PnL steps from equity curve."""
        if not m.equity_curve:
            return []
        # First point is just the PnL of first trade
        history = [m.equity_curve[0]]
        for i in range(1, len(m.equity_curve)):
            history.append(m.equity_curve[i] - m.equity_curve[i - 1])
        return history

    def _get_returns_series(self, m: AgentMetrics) -> List[float]:
        """Get % returns per trade."""
        if m.returns_history:
            return m.returns_history
        # Fallback for old data: assume $1000 base
        base_capital = 1000.0
        return [pnl / base_capital for pnl in self._get_pnl_history(m)]

    def _std_dev(self, data: List[float]) -> float:
        if len(data) < 2:
            return 0.0
        avg = sum(data) / len(data)
        variance = sum((x - avg) ** 2 for x in data) / (len(data) - 1)
        return math.sqrt(variance)

    def get_top_performing_agent(self) -> str:
        """Return ID of agent with best Sharpe."""
        if not self.metrics:
            return "random"
        return max(self.metrics.items(), key=lambda x: x[1].sharpe_ratio)[0]
