import asyncio
import time
from typing import Any, Dict, List, Optional, Tuple
from .definitions import SYMBOL_CONFIG, MinimalAgentState

class PositionManager:
    """
    Manages open positions, including syncing with exchange, 
    monitoring for TP/SL, and tracking state.
    """
    def __init__(self, exchange_client, agent_states: Dict[str, MinimalAgentState]):
        self.exchange_client = exchange_client
        self.agent_states = agent_states
        self.open_positions: Dict[str, Dict[str, Any]] = {}

    async def sync_from_exchange(self):
        """Sync positions from exchange to inherit existing positions on startup."""
        try:
            print("🔍 Scanning exchange for existing positions to takeover...")
            # Try to get open positions from the exchange
            response = await self.exchange_client.get_position_risk()

            if not response:
                print("✅ No existing positions found on exchange")
                return

            # Parse and load positions
            for pos in response:
                symbol = pos.get("symbol")
                if not symbol:
                    continue

                # Skip empty positions (Ghost positions)
                amt = float(pos.get("positionAmt", 0))
                if amt == 0:
                    continue

                # Store position in our tracking
                # Assign to default agent if not tracked
                # Use Strategy Optimization Agent or first available
                agent = self.agent_states.get("strategy-optimization-agent") or list(self.agent_states.values())[0]

                # Store position in our tracking
                self.open_positions[symbol] = {
                    "symbol": symbol,
                    "side": pos.get("positionSide", "LONG"),
                    "quantity": float(pos.get("positionAmt", 0)),
                    "entry_price": float(pos.get("entryPrice", 0)),
                    "unrealized_pnl": float(pos.get("unrealizedProfit", 0)),
                    "leverage": int(pos.get("leverage", 1)),
                    "agent": agent,
                    "agent_id": agent.id,
                    "tp_price": float(pos.get("entryPrice", 0)) * 1.05, # Default TP
                    "sl_price": float(pos.get("entryPrice", 0)) * 0.95, # Default SL
                }
                print(
                    f"   ✅ Inherited position: {symbol} {self.open_positions[symbol]['side']} x{self.open_positions[symbol]['quantity']}"
                )

            print(f"✅ Sync complete: Inherited {len(self.open_positions)} positions")

        except Exception as e:
            print(f"⚠️ Failed to sync open positions from exchange: {e}")

    async def monitor_positions(self) -> Dict[str, Any]:
        """Monitor open positions for TP/SL hits and return current ticker map."""
        ticker_map = {}
        try:
            # Always fetch all tickers in SYMBOL_CONFIG to support both monitoring AND new trade analysis
            # This acts as a cache for this tick
            symbols_to_fetch = list(SYMBOL_CONFIG.keys())
            tasks = [self.exchange_client.get_ticker(sym) for sym in symbols_to_fetch]
            tickers = await asyncio.gather(*tasks, return_exceptions=True)

            for sym, res in zip(symbols_to_fetch, tickers):
                if isinstance(res, dict):
                    ticker_map[sym] = res
                else:
                    # print(f"⚠️ Failed to fetch ticker for {sym}: {res}")
                    pass

        except Exception as e:
            print(f"⚠️ Error fetching batched tickers: {e}")
            return {}

        if not self.open_positions:
            return ticker_map

        symbols_to_check = list(self.open_positions.keys())
        for symbol in symbols_to_check:
            if symbol not in ticker_map:
                continue

            pos = self.open_positions[symbol]
            agent = pos["agent"]
            ticker = ticker_map[symbol]

            try:
                current_price = float(ticker.get("lastPrice", 0))

                if current_price <= 0:
                    continue

                # Update current price in position for dashboard
                pos["current_price"] = current_price

                # Check TP/SL logic is handled by the caller or we can return signals here
                # For now, we just return the ticker map and let the service handle the actual closing logic
                # using check_profit_taking helper.
                
                # Ideally, we should move the trailing stop logic here too.
                self._update_trailing_stop(symbol, pos, current_price, agent)

            except Exception as e:
                print(f"⚠️ Error monitoring position {symbol}: {e}")

        return ticker_map

    def _update_trailing_stop(self, symbol: str, pos: Dict[str, Any], current_price: float, agent: MinimalAgentState):
        """Internal helper to update trailing stops."""
        try:
            if pos["side"] == "BUY":
                pnl_pct = (current_price - pos["entry_price"]) / pos["entry_price"]
                
                # 1. Move to Break Even if > 1.5% profit
                if pnl_pct > 0.015 and pos["sl_price"] < pos["entry_price"]:
                    pos["sl_price"] = pos["entry_price"] * 1.002  # BE + small profit
                    print(f"🛡️ Trailing Stop Updated for {symbol} (Long): Moved to Break Even")
                    
                # 2. Lock in Profit if > 3% profit
                elif pnl_pct > 0.03 and pos["sl_price"] < (pos["entry_price"] * 1.015):
                    pos["sl_price"] = pos["entry_price"] * 1.015  # Lock 1.5%
                    print(f"🔒 Trailing Stop Updated for {symbol} (Long): Locked 1.5% Profit")

            elif pos["side"] == "SELL":
                pnl_pct = (pos["entry_price"] - current_price) / pos["entry_price"]

                # 1. Move to Break Even if > 1.5% profit
                if pnl_pct > 0.015 and pos["sl_price"] > pos["entry_price"]:
                    pos["sl_price"] = pos["entry_price"] * 0.998  # BE + small profit
                    print(f"🛡️ Trailing Stop Updated for {symbol} (Short): Moved to Break Even")
                    
                # 2. Lock in Profit if > 3% profit
                elif pnl_pct > 0.03 and pos["sl_price"] > (pos["entry_price"] * 0.985):
                    pos["sl_price"] = pos["entry_price"] * 0.985  # Lock 1.5%
                    print(f"🔒 Trailing Stop Updated for {symbol} (Short): Locked 1.5% Profit")
        except Exception as e:
            print(f"⚠️ Error updating trailing stop for {symbol}: {e}")

    async def check_profit_taking(self, symbol: str, position: Dict[str, Any], current_price: float) -> Tuple[bool, str]:
        """Check if a position should be closed for profit or stop loss."""
        try:
            entry_price = position["entry_price"]
            side = position["side"]
            
            if side == "BUY":
                pnl_pct = (current_price - entry_price) / entry_price
            else:
                pnl_pct = (entry_price - current_price) / entry_price
                
            # Hard Profit Target (2% - aggressive)
            if pnl_pct > 0.02:
                return True, f"Hard Profit Target Hit (+{pnl_pct*100:.2f}%)"
                
            # Hard Stop Loss (-5%)
            if pnl_pct < -0.05:
                return True, f"Hard Stop Loss Hit ({pnl_pct*100:.2f}%)"
                
            # Trailing Stop Logic (Simplified)
            # If we are up > 1%, ensure we don't lose it all
            if pnl_pct > 0.01 and pnl_pct < 0.005: # Dropped back down
                 return True, f"Trailing Stop Hit (Locked in {pnl_pct*100:.2f}%)"

            return False, ""
        except Exception as e:
            print(f"⚠️ Error in profit taking check: {e}")
            return False, ""
