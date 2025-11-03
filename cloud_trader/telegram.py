"""Telegram notification service for trading alerts."""

import asyncio
import logging
from typing import Any, Dict, Optional

import httpx

logger = logging.getLogger(__name__)


class TelegramService:
    """Service for sending formatted trade notifications via Telegram."""

    def __init__(self, bot_token: str, chat_id: str):
        self.bot_token = bot_token
        self.chat_id = chat_id
        self.base_url = f"https://api.telegram.org/bot{bot_token}"
        self.client = httpx.AsyncClient(timeout=30.0)

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()

    async def send_message(self, message: str, parse_mode: str = "HTML") -> bool:
        """Send a message to the configured Telegram chat.

        Args:
            message: The message content
            parse_mode: Message formatting (HTML, Markdown, etc.)

        Returns:
            bool: True if message sent successfully
        """
        try:
            url = f"{self.base_url}/sendMessage"
            payload = {
                "chat_id": self.chat_id,
                "text": message,
                "parse_mode": parse_mode,
                "disable_web_page_preview": True,
            }

            response = await self.client.post(url, json=payload)
            response.raise_for_status()

            result = response.json()
            if result.get("ok"):
                logger.info(f"✅ Telegram message sent successfully")
                return True
            else:
                logger.error(f"❌ Telegram API error: {result.get('description')}")
                return False

        except Exception as exc:
            logger.error(f"❌ Failed to send Telegram message: {exc}")
            return False

    async def send_trade_notification(
        self,
        symbol: str,
        side: str,
        price: float,
        quantity: float,
        notional: float,
        decision_reason: str,
        model_used: str = "unknown",
        confidence: float = 0.0,
        take_profit: Optional[float] = None,
        stop_loss: Optional[float] = None,
        portfolio_balance: Optional[float] = None,
        risk_percentage: Optional[float] = None,
    ) -> bool:
        """Send a detailed trade notification.

        Args:
            symbol: Trading pair (e.g., "BTCUSDT")
            side: "BUY" or "SELL"
            price: Entry price
            quantity: Quantity traded
            notional: Notional value
            decision_reason: Why this trade was made
            model_used: AI model that made the decision
            confidence: Confidence score (0-1)
            take_profit: Take profit price
            stop_loss: Stop loss price
            portfolio_balance: Current portfolio balance
            risk_percentage: Risk as % of portfolio

        Returns:
            bool: True if notification sent successfully
        """
        try:
            # Format side with emoji
            side_emoji = "🟢" if side.upper() == "BUY" else "🔴"
            side_text = f"{side_emoji} <b>{side.upper()}</b>"

            # Format numbers
            price_fmt = f"${price:,.4f}"
            quantity_fmt = f"{quantity:,.6f}"
            notional_fmt = f"${notional:,.2f}"
            confidence_pct = f"{confidence:.1%}" if confidence > 0 else "N/A"

            # Build message
            message = f"""
🚀 <b>TRADE EXECUTED</b> 🚀

<b>Symbol:</b> {symbol}
<b>Action:</b> {side_text}
<b>Entry Price:</b> {price_fmt}
<b>Quantity:</b> {quantity_fmt}
<b>Notional Value:</b> {notional_fmt}

📊 <b>Trade Details</b>
<b>Model:</b> {model_used}
<b>Confidence:</b> {confidence_pct}
"""

            if portfolio_balance:
                balance_fmt = f"${portfolio_balance:,.2f}"
                message += f"<b>Portfolio Balance:</b> {balance_fmt}\n"

            if risk_percentage:
                risk_fmt = f"{risk_percentage:.2f}%"
                message += f"<b>Risk Exposure:</b> {risk_fmt}\n"

            if take_profit:
                tp_fmt = f"${take_profit:,.4f}"
                message += f"<b>Take Profit:</b> {tp_fmt}\n"

            if stop_loss:
                sl_fmt = f"${stop_loss:,.4f}"
                message += f"<b>Stop Loss:</b> {sl_fmt}\n"

            # Add decision reasoning
            if decision_reason:
                message += f"\n🧠 <b>Decision Logic</b>\n{decision_reason}"

            # Add timestamp
            from datetime import datetime
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")
            message += f"\n\n⏰ <i>Executed at: {timestamp}</i>"

            return await self.send_message(message.strip())

        except Exception as exc:
            logger.error(f"❌ Failed to format trade notification: {exc}")
            return False

    async def send_portfolio_update(
        self,
        balance: float,
        total_exposure: float,
        positions_count: int,
        pnl_24h: Optional[float] = None,
        win_rate: Optional[float] = None,
    ) -> bool:
        """Send a portfolio status update.

        Args:
            balance: Current portfolio balance
            total_exposure: Total exposure across positions
            positions_count: Number of active positions
            pnl_24h: 24h P&L if available
            win_rate: Win rate if available

        Returns:
            bool: True if notification sent successfully
        """
        try:
            balance_fmt = f"${balance:,.2f}"
            exposure_fmt = f"${total_exposure:,.2f}"

            message = f"""
📊 <b>PORTFOLIO UPDATE</b>

<b>Balance:</b> {balance_fmt}
<b>Total Exposure:</b> {exposure_fmt}
<b>Active Positions:</b> {positions_count}
"""

            if pnl_24h is not None:
                pnl_emoji = "📈" if pnl_24h >= 0 else "📉"
                pnl_fmt = f"${pnl_24h:+,.2f}"
                message += f"<b>24h P&L:</b> {pnl_emoji} {pnl_fmt}\n"

            if win_rate is not None:
                win_fmt = f"{win_rate:.1%}"
                message += f"<b>Win Rate:</b> {win_fmt}\n"

            # Add timestamp
            from datetime import datetime
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")
            message += f"\n⏰ <i>Updated at: {timestamp}</i>"

            return await self.send_message(message.strip())

        except Exception as exc:
            logger.error(f"❌ Failed to format portfolio update: {exc}")
            return False

    async def send_alert(
        self,
        alert_type: str,
        message: str,
        severity: str = "info"
    ) -> bool:
        """Send an alert notification.

        Args:
            alert_type: Type of alert (e.g., "ERROR", "WARNING", "INFO")
            message: Alert message
            severity: Alert severity level

        Returns:
            bool: True if notification sent successfully
        """
        try:
            # Format severity with emoji
            severity_emoji = {
                "error": "🚨",
                "warning": "⚠️",
                "success": "✅",
                "info": "ℹ️"
            }.get(severity.lower(), "📢")

            formatted_message = f"""
{severity_emoji} <b>{alert_type.upper()} ALERT</b>

{message}
"""

            # Add timestamp
            from datetime import datetime
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")
            formatted_message += f"\n⏰ <i>{timestamp}</i>"

            return await self.send_message(formatted_message.strip())

        except Exception as exc:
            logger.error(f"❌ Failed to send alert: {exc}")
            return False


async def create_telegram_service(settings) -> Optional[TelegramService]:
    """Create a Telegram service if credentials are configured.

    Args:
        settings: Application settings object

    Returns:
        TelegramService instance or None if not configured
    """
    if not settings.telegram_bot_token or not settings.telegram_chat_id:
        logger.info("Telegram notifications not configured - skipping")
        return None

    try:
        service = TelegramService(settings.telegram_bot_token, settings.telegram_chat_id)

        # Test the connection with a simple message
        test_message = "🤖 <b>Sapphire AI Trading Bot</b>\n\n✅ Bot initialized and ready for trade notifications!"
        success = await service.send_message(test_message)

        if success:
            logger.info("✅ Telegram service initialized successfully")
            return service
        else:
            logger.error("❌ Failed to send test message to Telegram")
            return None

    except Exception as exc:
        logger.error(f"❌ Failed to initialize Telegram service: {exc}")
        return None
