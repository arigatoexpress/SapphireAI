from __future__ import annotations

import asyncio
from datetime import datetime, timedelta
from typing import Any, Dict, List

try:
    import pandas as pd
except ImportError:
    pd = None
    print("⚠️ Pandas not found. FeaturePipeline will be disabled.")

# Mocking Aster Client dependency to avoid circular imports if possible,
# but in real app we inject it.


class FeaturePipeline:
    def __init__(self, exchange_client):
        self.client = exchange_client

    async def fetch_candles(self, symbol: str, interval: str = "1h", limit: int = 100) -> Any:
        """Fetch OHLCV data and return as DataFrame."""
        if pd is None:
            return []

        try:
            klines = await self.client.get_historical_klines(symbol, interval, limit)
            if not klines:
                return pd.DataFrame()

            # Parse binance-like kline format: [time, open, high, low, close, volume, ...]
            df = pd.DataFrame(
                klines,
                columns=[
                    "timestamp",
                    "open",
                    "high",
                    "low",
                    "close",
                    "volume",
                    "close_time",
                    "quote_volume",
                    "trades",
                    "taker_buy_base",
                    "taker_buy_quote",
                    "ignore",
                ],
            )

            # Convert types
            numeric_cols = ["open", "high", "low", "close", "volume"]
            df[numeric_cols] = df[numeric_cols].apply(pd.to_numeric)
            df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")

            return df
        except Exception as e:
            print(f"⚠️ Failed to fetch candles for {symbol}: {e}")
            return pd.DataFrame()

    def calculate_indicators(self, df: Any) -> Any:
        """Calculate comprehensive technical indicators."""
        if pd is None or not isinstance(df, pd.DataFrame) or df.empty:
            return df

        # Trend (Manual Calculation to bypass pandas-ta issue)
        df["EMA_20"] = df["close"].ewm(span=20, adjust=False).mean()
        df["EMA_50"] = df["close"].ewm(span=50, adjust=False).mean()

        # RSI 14
        delta = df["close"].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        df["RSI_14"] = 100 - (100 / (1 + rs))

        # ATR 14
        high_low = df["high"] - df["low"]
        high_close = (df["high"] - df["close"].shift()).abs()
        low_close = (df["low"] - df["close"].shift()).abs()
        ranges = pd.concat([high_low, high_close, low_close], axis=1)
        true_range = ranges.max(axis=1)
        df["ATRr_14"] = true_range.rolling(window=14).mean()

        return df

    async def get_market_analysis(self, symbol: str) -> Dict[str, Any]:
        """Get full analysis snapshot for an agent."""

        # Parallel fetch for speed
        candles_task = self.fetch_candles(symbol, interval="1h", limit=100)
        orderbook_task = self.client.get_order_book(symbol, limit=20)

        results = await asyncio.gather(candles_task, orderbook_task, return_exceptions=True)
        df, orderbook = results[0], results[1]

        # 1. Technical Analysis
        ta_data = {}
        if pd is not None and isinstance(df, pd.DataFrame) and not df.empty:
            df = self.calculate_indicators(df)
            latest = df.iloc[-1]
            ta_data = {
                "rsi": float(latest.get("RSI_14", 50)),
                "atr": float(latest.get("ATRr_14", 0)),
                "ema_20": float(latest.get("EMA_20", 0)),
                "ema_50": float(latest.get("EMA_50", 0)),
                "trend": "BULLISH" if latest["close"] > latest.get("EMA_50", 0) else "BEARISH",
                "volatility_state": (
                    "HIGH" if latest.get("ATRr_14", 0) > (latest["close"] * 0.02) else "LOW"
                ),
            }

        # 2. Order Book Analysis (Depth & Pressure)
        ob_data = {"bid_pressure": 0.0, "spread_pct": 0.0}
        if isinstance(orderbook, dict) and "bids" in orderbook:
            try:
                bids = [float(x[1]) for x in orderbook["bids"]]
                asks = [float(x[1]) for x in orderbook["asks"]]
                bid_vol = sum(bids)
                ask_vol = sum(asks)
                total_vol = bid_vol + ask_vol

                if total_vol > 0:
                    ob_data["bid_pressure"] = bid_vol / total_vol  # >0.5 means buying pressure

                best_bid = float(orderbook["bids"][0][0])
                best_ask = float(orderbook["asks"][0][0])
                if best_ask > 0:
                    ob_data["spread_pct"] = (best_ask - best_bid) / best_ask
            except Exception:
                pass

        return {
            "symbol": symbol,
            "price": ta_data.get("close", 0) if ta_data else 0,  # Fallback
            **ta_data,
            **ob_data,
        }
