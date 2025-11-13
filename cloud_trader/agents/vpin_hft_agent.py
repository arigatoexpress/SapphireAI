import asyncio
import math
from typing import Any, Dict, List

class VpinHFTAgent:
    def __init__(self, exchange_client: Any, pubsub_client: Any, risk_manager_topic: str):
        self.exchange_client = exchange_client
        self.pubsub_client = pubsub_client
        self.risk_manager_topic = risk_manager_topic
        self.vpin_threshold = 0.4  # Dynamic threshold, can be adjusted

    def calculate_vpin(self, tick_data_batch: List[Dict[str, Any]]) -> float:
        """
        Calculates VPIN from tick data batch.
        VPIN = (sum(|Vbuy - Vsell|) / sum(Vbuy + Vsell)) * sqrt(N)
        - Vbuy/Vsell determined by tick direction (price change sign)
        - Rolling window calculation for real-time processing
        - Returns VPIN value (0-1 scale, typically 0.1-0.5)
        """
        if len(tick_data_batch) < 10:
            return 0.0

        buy_volume = 0.0
        sell_volume = 0.0
        total_volume = 0.0

        for tick in tick_data_batch:
            price_change = tick['price'] - tick.get('prev_price', tick['price'])
            volume = tick.get('volume', 0.0)
            total_volume += volume

            if price_change > 0:
                buy_volume += volume
            elif price_change < 0:
                sell_volume += volume
            else:
                # Neutral tick, split volume
                buy_volume += volume / 2
                sell_volume += volume / 2

        if total_volume == 0:
            return 0.0

        volume_imbalance = abs(buy_volume - sell_volume)
        vpin = (volume_imbalance / total_volume) * math.sqrt(len(tick_data_batch))

        return min(vpin, 1.0)  # Cap at 1.0

    async def execute_trade(self, vpin_signal: float, symbol: str):
        """
        Executes a trade if the VPIN signal crosses a threshold.
        """
        if vpin_signal > self.vpin_threshold:
            # Execute aggressive 30x leverage trade
            # High VPIN signals order flow toxicity, often preceding reversals
            # For simplicity, we buy on high VPIN signals (fade the sell pressure)
            side = "BUY"

            try:
                # Get current price
                ticker = await self.exchange_client.get_ticker_price(symbol)
                price = float(ticker.get("price", 0))
                if price <= 0:
                    return

                # Calculate position size (30x leverage on $1000 notional)
                notional = 1000.0
                quantity = (notional * 30) / price  # 30x leverage

                # Place the order
                order = await self.exchange_client.place_order(
                    symbol=symbol,
                    side=side,
                    quantity=quantity,
                    price=price,
                    leverage=30,
                    order_type="MARKET"
                )

                print(f"VPIN trade executed: {side} {quantity:.4f} {symbol} at ~${price:.4f} (VPIN: {vpin_signal:.4f})")

                # Post position details to RiskManager via Pub/Sub
                position_details = {
                    "symbol": symbol,
                    "side": side,
                    "notional": notional,
                    "leverage": 30,
                    "vpin_signal": vpin_signal,
                    "source": "vpin-hft",
                    "order_id": order.get("orderId"),
                    "quantity": quantity,
                    "price": price,
                    "timestamp": asyncio.get_event_loop().time()
                }
                await self.pubsub_client.publish(self.risk_manager_topic, position_details)

            except Exception as e:
                print(f"VPIN trade execution failed for {symbol}: {e}")
