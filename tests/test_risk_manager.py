from cloud_trader.config import Settings
from cloud_trader.risk import PortfolioState, RiskManager


def test_risk_manager_respects_position_limits() -> None:
    settings = Settings(max_position_risk=0.1, max_concurrent_positions=2)
    risk = RiskManager(settings)

    portfolio = PortfolioState(balance=1000.0, total_exposure=0.0, positions={})
    assert risk.can_open_position(portfolio, order_notional=50.0)

    # Register first position
    portfolio = risk.register_fill(portfolio, "BTCUSDT", 50.0)
    # Exceed notional limit (20% of balance)
    assert not risk.can_open_position(portfolio, order_notional=250.0)

    # Fill second position within limits
    portfolio = risk.register_fill(portfolio, "ETHUSDT", 50.0)
    # Third position blocked due to concurrency cap
    assert not risk.can_open_position(portfolio, order_notional=50.0)
