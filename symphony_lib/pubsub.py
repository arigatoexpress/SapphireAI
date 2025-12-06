import json
import logging
import os
from typing import Any, Callable, Dict, Optional
from google.cloud import pubsub_v1
from .models import MarketRegime, StrategySignal

logger = logging.getLogger(__name__)

class SymphonyClient:
    """
    Client for interacting with the Agent Symphony Pub/Sub infrastructure.
    """
    def __init__(self, project_id: str, service_name: str):
        self.project_id = project_id
        self.service_name = service_name
        self.publisher = pubsub_v1.PublisherClient()
        self.subscriber = pubsub_v1.SubscriberClient()
        
        self.strategy_topic = f"projects/{project_id}/topics/symphony-strategy"
        self.execution_topic = f"projects/{project_id}/topics/symphony-execution"

    def publish_regime(self, regime: MarketRegime):
        """Publish a new market regime to the strategy topic."""
        try:
            data = json.dumps(regime.to_dict()).encode("utf-8")
            future = self.publisher.publish(
                self.strategy_topic, 
                data, 
                type="regime",
                source=self.service_name
            )
            return future.result()
        except Exception as e:
            logger.error(f"Failed to publish regime: {e}")
            return None

    def publish_signal(self, signal: StrategySignal):
        """Publish a strategy signal to the strategy topic."""
        try:
            data = json.dumps(signal.to_dict()).encode("utf-8")
            future = self.publisher.publish(
                self.strategy_topic, 
                data, 
                type="signal",
                source=self.service_name
            )
            return future.result()
        except Exception as e:
            logger.error(f"Failed to publish signal: {e}")
            return None

    def publish_execution(self, execution_data: Dict[str, Any]):
        """Publish execution details (trades, pnl) to the execution topic."""
        try:
            data = json.dumps(execution_data).encode("utf-8")
            future = self.publisher.publish(
                self.execution_topic, 
                data, 
                type="execution",
                source=self.service_name
            )
            return future.result()
        except Exception as e:
            logger.error(f"Failed to publish execution: {e}")
            return None

    def subscribe_strategy(self, subscription_id: str, callback: Callable[[Dict[str, Any]], None]):
        """Subscribe to the strategy topic."""
        subscription_path = self.subscriber.subscription_path(self.project_id, subscription_id)
        
        def _callback(message):
            try:
                data = json.loads(message.data.decode("utf-8"))
                msg_type = message.attributes.get("type")
                
                # Enrich with metadata
                data["_type"] = msg_type
                data["_source"] = message.attributes.get("source")
                
                callback(data)
                message.ack()
            except Exception as e:
                logger.error(f"Error processing strategy message: {e}")
                message.nack()

        streaming_pull_future = self.subscriber.subscribe(subscription_path, callback=_callback)
        return streaming_pull_future
