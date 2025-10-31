"""Simple risk guardrails for live trading."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict

from .config import Settings


@dataclass
class Position:
    symbol: str
    notional: float


@dataclass
class PortfolioState:
    balance: float
    total_exposure: float
    positions: Dict[str, Position]


class RiskManager:
    """Validate trades against conservative risk limits."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def can_open_position(self, portfolio: PortfolioState, order_notional: float) -> bool:
        if portfolio.balance <= 0:
            return False

        new_exposure = portfolio.total_exposure + order_notional
        if new_exposure > portfolio.balance * (1 + self._settings.max_drawdown):
            return False

        if order_notional > portfolio.balance * self._settings.max_position_risk:
            return False

        if len(portfolio.positions) >= self._settings.max_concurrent_positions:
            return False

        return True

    def register_fill(self, portfolio: PortfolioState, symbol: str, notional: float) -> PortfolioState:
        new_positions = dict(portfolio.positions)
        new_positions[symbol] = Position(symbol=symbol, notional=notional)
        return PortfolioState(
            balance=portfolio.balance,
            total_exposure=portfolio.total_exposure + notional,
            positions=new_positions,
        )

    def close_position(self, portfolio: PortfolioState, symbol: str) -> PortfolioState:
        new_positions = dict(portfolio.positions)
        position = new_positions.pop(symbol, None)
        total_exposure = portfolio.total_exposure
        if position:
            total_exposure -= position.notional
        return PortfolioState(balance=portfolio.balance, total_exposure=total_exposure, positions=new_positions)
