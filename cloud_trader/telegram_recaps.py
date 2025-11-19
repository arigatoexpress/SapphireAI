"""Telegram daily performance recap service using BigQuery analytics."""
from __future__ import annotations

import logging
import os
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

from google.cloud import bigquery
from telegram import Bot, InlineKeyboardButton, InlineKeyboardMarkup

from .config import Settings

logger = logging.getLogger(__name__)


class TelegramRecapService:
    """Service for generating and sending daily performance recaps via Telegram."""
    
    def __init__(self, bot_token: str, chat_id: str, settings: Settings):
        self.bot = Bot(token=bot_token)
        self.chat_id = chat_id
        self.settings = settings
        self._bq_client: Optional[bigquery.Client] = None
        
        if settings.gcp_project_id:
            try:
                self._bq_client = bigquery.Client(project=settings.gcp_project_id)
                logger.info("BigQuery client initialized for Telegram recaps")
            except Exception as e:
                logger.error(f"Failed to initialize BigQuery client: {e}")
    
    async def generate_daily_recap(self, hours: int = 24) -> Optional[str]:
        """Generate daily performance recap markdown report."""
        if not self._bq_client:
            logger.warning("BigQuery client not available for recap generation")
            return None
        
        try:
            # Calculate time range
            end_time = datetime.utcnow()
            start_time = end_time - timedelta(hours=hours)
            
            # Query BigQuery for trade statistics
            query = f"""
            SELECT 
                COUNT(*) as total_trades,
                SUM(CASE WHEN mode = 'live' THEN 1 ELSE 0 END) as live_trades,
                SUM(CASE WHEN mode = 'paper' THEN 1 ELSE 0 END) as paper_trades,
                SUM(notional) as total_volume,
                COUNT(DISTINCT symbol) as symbols_traded,
                COUNT(DISTINCT agent_id) as active_agents,
                SUM(CASE WHEN side = 'BUY' THEN 1 ELSE 0 END) as buy_orders,
                SUM(CASE WHEN side = 'SELL' THEN 1 ELSE 0 END) as sell_orders
            FROM `{self.settings.gcp_project_id}.trading_analytics.trades_stream`
            WHERE TIMESTAMP(timestamp) >= TIMESTAMP('{start_time.isoformat()}')
              AND TIMESTAMP(timestamp) <= TIMESTAMP('{end_time.isoformat()}')
            """
            
            query_job = self._bq_client.query(query)
            results = query_job.result()
            row = next(iter(results), None)
            
            if not row:
                return "📊 *Daily Recap*\n\nNo trading activity in the last 24 hours."
            
            # Query agent performance
            agent_query = f"""
            SELECT 
                agent_id,
                COUNT(*) as trades,
                SUM(notional) as volume,
                COUNT(DISTINCT symbol) as symbols
            FROM `{self.settings.gcp_project_id}.trading_analytics.trades_stream`
            WHERE TIMESTAMP(timestamp) >= TIMESTAMP('{start_time.isoformat()}')
              AND TIMESTAMP(timestamp) <= TIMESTAMP('{end_time.isoformat()}')
              AND agent_id IS NOT NULL
            GROUP BY agent_id
            ORDER BY trades DESC
            LIMIT 6
            """
            
            agent_job = self._bq_client.query(agent_query)
            agent_results = list(agent_job.result())
            
            # Build markdown report
            report = f"📊 *Daily Trading Recap* \\- {hours}h\n\n"
            report += f"⏰ Period: `{start_time.strftime('%Y-%m-%d %H:%M')}` to `{end_time.strftime('%Y-%m-%d %H:%M')}` UTC\n\n"
            
            # Overall stats
            report += "*Overall Performance:*\n"
            report += f"• Total Trades: `{row.total_trades}`\n"
            report += f"  ├─ Live: `{row.live_trades}`\n"
            report += f"  └─ Paper: `{row.paper_trades}`\n"
            report += f"• Total Volume: `${row.total_volume:,.2f}`\n"
            report += f"• Symbols Traded: `{row.symbols_traded}`\n"
            report += f"• Buy/Sell Ratio: `{row.buy_orders}/{row.sell_orders}`\n\n"
            
            # Agent performance
            if agent_results:
                report += "*Top Agents:*\n"
                for agent in agent_results[:6]:
                    agent_name = agent.agent_id.replace('-', ' ').title() if agent.agent_id else "Unknown"
                    report += f"• {agent_name}: `{agent.trades}` trades, `${agent.volume:,.2f}` volume, `{agent.symbols}` symbols\n"
                report += "\n"
            
            report += "\\#SapphireTrade #DailyRecap"
            
            return report
            
        except Exception as e:
            logger.error(f"Failed to generate daily recap: {e}")
            return None
    
    async def send_recap(self, hours: int = 24, include_chart: bool = True) -> bool:
        """Send daily recap via Telegram with optional chart."""
        try:
            # Generate markdown report
            report = await self.generate_daily_recap(hours)
            if not report:
                logger.warning("Failed to generate recap report")
                return False
            
            # Create inline keyboard for actions
            keyboard = [
                [
                    InlineKeyboardButton("📈 View Dashboard", url="https://sapphiretrade.xyz"),
                    InlineKeyboardButton("🔄 Refresh", callback_data="recap_refresh")
                ],
                [
                    InlineKeyboardButton("📊 Paper Mode", callback_data="recap_paper"),
                    InlineKeyboardButton("⚙️ Settings", callback_data="recap_settings")
                ]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            # Send message
            await self.bot.send_message(
                chat_id=self.chat_id,
                text=report,
                parse_mode='MarkdownV2',
                reply_markup=reply_markup
            )
            
            # Send chart if requested
            if include_chart:
                chart_url = await self._generate_performance_chart(hours)
                if chart_url:
                    await self.bot.send_photo(
                        chat_id=self.chat_id,
                        photo=chart_url,
                        caption="📈 Performance Chart"
                    )
            
            logger.info("Daily recap sent successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send daily recap: {e}")
            return False
    
    async def _generate_performance_chart(self, hours: int) -> Optional[str]:
        """Generate performance chart and upload to GCS, return public URL."""
        try:
            import matplotlib
            matplotlib.use('Agg')  # Non-interactive backend
            import matplotlib.pyplot as plt
            import matplotlib.dates as mdates
            from io import BytesIO
            
            if not self._bq_client:
                return None
            
            # Query hourly trade volume
            end_time = datetime.utcnow()
            start_time = end_time - timedelta(hours=hours)
            
            query = f"""
            SELECT 
                TIMESTAMP_TRUNC(TIMESTAMP(timestamp), HOUR) as hour,
                COUNT(*) as trades,
                SUM(notional) as volume
            FROM `{self.settings.gcp_project_id}.trading_analytics.trades_stream`
            WHERE TIMESTAMP(timestamp) >= TIMESTAMP('{start_time.isoformat()}')
              AND TIMESTAMP(timestamp) <= TIMESTAMP('{end_time.isoformat()}')
            GROUP BY hour
            ORDER BY hour
            """
            
            query_job = self._bq_client.query(query)
            results = list(query_job.result())
            
            if not results:
                return None
            
            # Create chart
            hours_list = [r.hour for r in results]
            volume_list = [r.volume for r in results]
            trades_list = [r.trades for r in results]
            
            fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(10, 6), facecolor='black')
            fig.suptitle('Trading Performance (24h)', color='white', fontsize=14, fontweight='bold')
            
            # Volume chart
            ax1.plot(hours_list, volume_list, color='#00ffff', linewidth=2, marker='o', markersize=4)
            ax1.fill_between(hours_list, volume_list, alpha=0.3, color='#00ffff')
            ax1.set_ylabel('Volume (USD)', color='white')
            ax1.set_title('Trading Volume', color='white')
            ax1.set_facecolor('black')
            ax1.tick_params(colors='white')
            ax1.grid(True, alpha=0.3, color='gray')
            ax1.xaxis.set_major_formatter(mdates.DateFormatter('%H:%M'))
            ax1.xaxis.set_major_locator(mdates.HourLocator(interval=max(1, hours // 6)))
            
            # Trades chart
            ax2.bar(hours_list, trades_list, color='#a855f7', alpha=0.7)
            ax2.set_ylabel('Number of Trades', color='white')
            ax2.set_xlabel('Time (UTC)', color='white')
            ax2.set_title('Trades per Hour', color='white')
            ax2.set_facecolor('black')
            ax2.tick_params(colors='white')
            ax2.grid(True, alpha=0.3, color='gray', axis='y')
            ax2.xaxis.set_major_formatter(mdates.DateFormatter('%H:%M'))
            ax2.xaxis.set_major_locator(mdates.HourLocator(interval=max(1, hours // 6)))
            
            plt.tight_layout()
            
            # Save to BytesIO
            buf = BytesIO()
            plt.savefig(buf, format='png', facecolor='black', dpi=100, bbox_inches='tight')
            buf.seek(0)
            plt.close()
            
            # Upload to GCS
            from google.cloud import storage
            
            bucket_name = f"{self.settings.gcp_project_id}-telegram-charts"
            storage_client = storage.Client(project=self.settings.gcp_project_id)
            
            # Create bucket if it doesn't exist
            try:
                bucket = storage_client.bucket(bucket_name)
                if not bucket.exists():
                    bucket = storage_client.create_bucket(bucket_name, location='us-central1')
                    # Make bucket public for chart URLs
                    bucket.make_public(recursive=True)
            except Exception as e:
                logger.warning(f"Bucket operation failed: {e}")
                try:
                    bucket = storage_client.bucket(bucket_name)
                except:
                    return None
            
            # Upload chart
            blob_name = f"recaps/recap_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.png"
            blob = bucket.blob(blob_name)
            blob.upload_from_file(buf, content_type='image/png')
            blob.make_public()
            
            # Return public URL
            url = f"https://storage.googleapis.com/{bucket_name}/{blob_name}"
            logger.info(f"Chart uploaded to {url}")
            return url
            
        except Exception as e:
            logger.error(f"Failed to generate performance chart: {e}")
            return None


async def create_recap_service(settings: Settings) -> Optional[TelegramRecapService]:
    """Factory function to create Telegram recap service."""
    if settings.telegram_bot_token and settings.telegram_chat_id:
        return TelegramRecapService(
            bot_token=settings.telegram_bot_token,
            chat_id=settings.telegram_chat_id,
            settings=settings
        )
    return None

