"""Basic momentum strategy tuned for perpetual futures trading."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Optional


@dataclass
class MarketSnapshot:
    price: float
    change_24h: float
    volume: float


class MomentumStrategy:
    """Very small heuristic for demonstration purposes."""

    def __init__(self, threshold: float = 2.5) -> None:
        self.threshold = threshold

    def should_enter(self, symbol: str, market: MarketSnapshot) -> Optional[str]:
        """Return order side ('BUY'/'SELL') or None."""

        if market.volume <= 0 or market.price <= 0:
            return None

        if market.change_24h >= self.threshold:
            return "BUY"
        if market.change_24h <= -self.threshold:
            return "SELL"
        return None

    def allocate_notional(self, portfolio_balance: float) -> float:
        return portfolio_balance * 0.05  # deploy 5% per signal


def parse_market_payload(payload: Dict[str, float]) -> MarketSnapshot:
    return MarketSnapshot(
        price=float(payload.get("price", 0.0)),
        change_24h=float(payload.get("change_24h", 0.0)),
        volume=float(payload.get("volume", 0.0)),
    )
