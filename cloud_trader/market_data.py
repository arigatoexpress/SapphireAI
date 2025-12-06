from typing import Any, Dict

class MarketDataManager:
    """
    Manages market data, including exchange structure (precision, filters)
    and potentially ticker data.
    """
    def __init__(self, exchange_client):
        self.exchange_client = exchange_client
        self.market_structure: Dict[str, Dict[str, Any]] = {}

    async def fetch_structure(self):
        """Fetch all available symbols and their precision/filters from exchange."""
        try:
            print("🌍 Fetching global market structure (all symbols)...")
            # Assuming get_exchange_info returns raw exchange info dict
            # AsterClient.get_exchange_info() usually returns dict with 'symbols' list
            info = await self.exchange_client.get_exchange_info()

            count = 0
            if info and "symbols" in info:
                for s in info["symbols"]:
                    symbol = s["symbol"]
                    if not symbol.endswith("USDT"):  # Focus on USDT pairs for now
                        continue

                    # Extract precision
                    precision = s.get("quantityPrecision", 0)
                    price_precision = s.get("pricePrecision", 2)

                    # Extract Min Qty if available (filters)
                    min_qty = 0.1  # Default safe fallback
                    step_size = 0.1
                    for f in s.get("filters", []):
                        if f["filterType"] == "LOT_SIZE":
                            min_qty = float(f.get("minQty", 0))
                            step_size = float(f.get("stepSize", 0))

                    self.market_structure[symbol] = {
                        "precision": precision,
                        "price_precision": price_precision,
                        "min_qty": min_qty,
                        "step_size": step_size,
                    }
                    count += 1

            print(f"✅ Loaded market structure for {count} pairs.")

        except Exception as e:
            print(f"⚠️ Failed to fetch market structure: {e}. Falling back to config.")
