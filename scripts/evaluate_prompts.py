#!/usr/bin/env python3
"""Prompt evaluation script for testing AI inference prompts before deployment.

This script tests prompts with various market conditions and collects metrics
on response success rates, confidence distributions, and latency.
"""

import asyncio
import csv
import json
import logging
import statistics
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional

import pandas as pd

# Add parent directory to path for imports
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from cloud_trader.prompt_engineer import PromptBuilder, ResponseValidator, PromptContext
from cloud_trader.strategy import MarketSnapshot
from cloud_trader.vertex_ai_client import get_vertex_client
from cloud_trader.config import get_settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PromptEvaluator:
    """Evaluates prompts with test data and collects metrics."""

    def __init__(self, prompt_version: str = "v1.0"):
        self.prompt_version = prompt_version
        self.prompt_builder = PromptBuilder(prompt_version=prompt_version)
        self.response_validator = ResponseValidator()
        self.settings = get_settings()
        self.vertex_client = None
        
        # Metrics storage
        self.results: List[Dict[str, Any]] = []
        self.latencies: List[float] = []
        self.confidences: List[float] = []
        self.parse_errors = 0
        self.validation_errors = 0
        self.total_tests = 0

    async def initialize(self):
        """Initialize Vertex AI client."""
        if self.settings.enable_vertex_ai:
            try:
                self.vertex_client = get_vertex_client()
                if self.vertex_client:
                    logger.info("Vertex AI client initialized")
                else:
                    logger.warning("Vertex AI client not available, using mock responses")
            except Exception as e:
                logger.warning(f"Failed to initialize Vertex AI client: {e}")

    def generate_test_market_data(self) -> List[MarketSnapshot]:
        """Generate test market data scenarios."""
        scenarios = [
            # Bullish momentum
            MarketSnapshot(
                price=50000.0,
                volume_24h=1500000.0,
                change_24h=8.5,
                volatility=0.025,
                sma_20=48000.0,
                rsi=70.0
            ),
            # Bearish momentum
            MarketSnapshot(
                price=45000.0,
                volume_24h=1200000.0,
                change_24h=-6.2,
                volatility=0.030,
                sma_20=47000.0,
                rsi=35.0
            ),
            # Overbought (mean reversion opportunity)
            MarketSnapshot(
                price=52000.0,
                volume_24h=800000.0,
                change_24h=15.0,
                volatility=0.028,
                sma_20=48000.0,
                rsi=82.0
            ),
            # Oversold (mean reversion opportunity)
            MarketSnapshot(
                price=43000.0,
                volume_24h=900000.0,
                change_24h=-12.0,
                volatility=0.032,
                sma_20=46000.0,
                rsi=28.0
            ),
            # Neutral/consolidation
            MarketSnapshot(
                price=48000.0,
                volume_24h=600000.0,
                change_24h=0.5,
                volatility=0.015,
                sma_20=47800.0,
                rsi=52.0
            ),
        ]
        return scenarios

    def generate_test_signals(self) -> List[List[Dict[str, Any]]]:
        """Generate test technical signals."""
        return [
            # Momentum signals
            [
                {"strategy_name": "Momentum", "direction": "BUY", "confidence": 0.80, "reasoning": "Strong trend"},
                {"strategy_name": "RSI", "direction": "BUY", "confidence": 0.65, "reasoning": "RSI favorable"}
            ],
            # Mean reversion signals
            [
                {"strategy_name": "MeanReversion", "direction": "SELL", "confidence": 0.75, "reasoning": "Overbought"},
                {"strategy_name": "BollingerBands", "direction": "SELL", "confidence": 0.70, "reasoning": "Upper band"}
            ],
            # Mixed signals
            [
                {"strategy_name": "Momentum", "direction": "BUY", "confidence": 0.60, "reasoning": "Weak trend"},
                {"strategy_name": "RSI", "direction": "SELL", "confidence": 0.55, "reasoning": "Neutral RSI"}
            ],
            # No signals (empty)
            [],
        ]

    async def evaluate_scenario(
        self,
        symbol: str,
        market_data: MarketSnapshot,
        technical_signals: List[Dict[str, Any]],
        agent_type: str = "general"
    ) -> Dict[str, Any]:
        """Evaluate a single scenario."""
        self.total_tests += 1
        
        result = {
            "timestamp": datetime.utcnow().isoformat(),
            "symbol": symbol,
            "prompt_version": self.prompt_version,
            "agent_type": agent_type,
            "market_price": market_data.price,
            "market_change_24h": market_data.change_24h,
            "success": False,
            "direction": None,
            "confidence": None,
            "latency_seconds": None,
            "error": None,
            "parse_error": False,
            "validation_error": False,
        }

        try:
            # Build prompt
            context = PromptContext(
                symbol=symbol,
                market_data=market_data,
                technical_signals=technical_signals,
                agent_type=agent_type
            )
            prompt = self.prompt_builder.build_prompt(context)

            # Call Vertex AI (or mock)
            start_time = time.time()
            if self.vertex_client:
                response = await self.vertex_client.predict_with_fallback(
                    agent_id="market-analysis",
                    prompt=prompt,
                    max_tokens=512
                )
            else:
                # Mock response for testing without Vertex AI
                response = self._mock_vertex_response(market_data, technical_signals)
            
            latency = time.time() - start_time
            result["latency_seconds"] = latency
            self.latencies.append(latency)

            # Validate response
            validated_response = self.response_validator.validate_and_parse(response, symbol)
            
            if validated_response:
                result["success"] = True
                result["direction"] = validated_response.direction
                result["confidence"] = validated_response.confidence
                result["rationale"] = validated_response.rationale[:200]  # Truncate for CSV
                self.confidences.append(validated_response.confidence)
            else:
                result["parse_error"] = True
                result["validation_error"] = True
                result["error"] = "Response validation failed"
                self.parse_errors += 1
                self.validation_errors += 1

        except Exception as e:
            result["error"] = str(e)
            logger.error(f"Error evaluating scenario: {e}")

        return result

    def _mock_vertex_response(self, market_data: MarketSnapshot, signals: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate a mock Vertex AI response for testing."""
        # Simple mock logic based on market conditions
        if market_data.change_24h > 5:
            direction = "BUY"
            confidence = 0.75
        elif market_data.change_24h < -5:
            direction = "SELL"
            confidence = 0.70
        else:
            direction = "HOLD"
            confidence = 0.55

        return {
            "response": json.dumps({
                "direction": direction,
                "confidence": confidence,
                "rationale": f"Mock analysis: Market change {market_data.change_24h:.2f}%, volatility {market_data.volatility:.4f}",
                "risk_assessment": "Mock risk assessment",
                "position_size_recommendation": confidence * 0.03
            })
        }

    async def run_evaluation(self, num_iterations: int = 10) -> None:
        """Run full evaluation suite."""
        logger.info(f"Starting prompt evaluation for version {self.prompt_version}")
        
        test_scenarios = self.generate_test_market_data()
        test_signals = self.generate_test_signals()
        symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT"]
        agent_types = ["momentum", "mean_reversion", "sentiment", "volatility", "general"]

        for iteration in range(num_iterations):
            for symbol in symbols:
                for market_data in test_scenarios:
                    for signals in test_signals:
                        for agent_type in agent_types[:2]:  # Limit to first 2 for speed
                            result = await self.evaluate_scenario(
                                symbol=symbol,
                                market_data=market_data,
                                technical_signals=signals,
                                agent_type=agent_type
                            )
                            self.results.append(result)
                            
                            # Rate limiting
                            await asyncio.sleep(0.1)

        logger.info(f"Evaluation complete: {len(self.results)} scenarios tested")

    def generate_report(self, output_file: Optional[str] = None) -> Dict[str, Any]:
        """Generate evaluation report."""
        if not self.results:
            logger.warning("No results to report")
            return {}

        df = pd.DataFrame(self.results)

        # Calculate metrics
        success_rate = df["success"].mean()
        parse_error_rate = df["parse_error"].mean()
        validation_error_rate = df["validation_error"].mean()

        avg_latency = statistics.mean(self.latencies) if self.latencies else 0
        p50_latency = statistics.median(self.latencies) if self.latencies else 0
        
        # Calculate percentiles manually if quantiles not available
        if len(self.latencies) >= 20:
            sorted_latencies = sorted(self.latencies)
            p95_idx = int(len(sorted_latencies) * 0.95)
            p95_latency = sorted_latencies[p95_idx] if p95_idx < len(sorted_latencies) else sorted_latencies[-1]
        else:
            p95_latency = 0
            
        if len(self.latencies) >= 100:
            sorted_latencies = sorted(self.latencies)
            p99_idx = int(len(sorted_latencies) * 0.99)
            p99_latency = sorted_latencies[p99_idx] if p99_idx < len(sorted_latencies) else sorted_latencies[-1]
        else:
            p99_latency = 0

        avg_confidence = statistics.mean(self.confidences) if self.confidences else 0
        confidence_std = statistics.stdev(self.confidences) if len(self.confidences) > 1 else 0

        direction_distribution = df[df["direction"].notna()]["direction"].value_counts().to_dict()

        report = {
            "prompt_version": self.prompt_version,
            "timestamp": datetime.utcnow().isoformat(),
            "total_tests": len(self.results),
            "success_rate": success_rate,
            "parse_error_rate": parse_error_rate,
            "validation_error_rate": validation_error_rate,
            "latency_seconds": {
                "mean": avg_latency,
                "p50": p50_latency,
                "p95": p95_latency,
                "p99": p99_latency,
            },
            "confidence": {
                "mean": avg_confidence,
                "std": confidence_std,
                "min": min(self.confidences) if self.confidences else 0,
                "max": max(self.confidences) if self.confidences else 0,
            },
            "direction_distribution": direction_distribution,
        }

        # Print report
        logger.info("\n" + "=" * 80)
        logger.info("PROMPT EVALUATION REPORT")
        logger.info("=" * 80)
        logger.info(f"Prompt Version: {report['prompt_version']}")
        logger.info(f"Total Tests: {report['total_tests']}")
        logger.info(f"Success Rate: {report['success_rate']:.2%}")
        logger.info(f"Parse Error Rate: {report['parse_error_rate']:.2%}")
        logger.info(f"Validation Error Rate: {report['validation_error_rate']:.2%}")
        logger.info(f"\nLatency (seconds):")
        logger.info(f"  Mean: {report['latency_seconds']['mean']:.3f}")
        logger.info(f"  P50: {report['latency_seconds']['p50']:.3f}")
        logger.info(f"  P95: {report['latency_seconds']['p95']:.3f}")
        logger.info(f"  P99: {report['latency_seconds']['p99']:.3f}")
        logger.info(f"\nConfidence:")
        logger.info(f"  Mean: {report['confidence']['mean']:.3f}")
        logger.info(f"  Std Dev: {report['confidence']['std']:.3f}")
        logger.info(f"  Range: {report['confidence']['min']:.3f} - {report['confidence']['max']:.3f}")
        logger.info(f"\nDirection Distribution: {report['direction_distribution']}")
        logger.info("=" * 80)

        # Save to CSV
        if output_file:
            df.to_csv(output_file, index=False)
            logger.info(f"\nResults saved to {output_file}")

            # Save report JSON
            report_file = output_file.replace('.csv', '_report.json')
            with open(report_file, 'w') as f:
                json.dump(report, f, indent=2)
            logger.info(f"Report saved to {report_file}")

        return report


async def main():
    """Main evaluation function."""
    import argparse

    parser = argparse.ArgumentParser(description="Evaluate AI trading prompts")
    parser.add_argument("--prompt-version", default="v1.0", help="Prompt version to evaluate")
    parser.add_argument("--iterations", type=int, default=5, help="Number of iterations per scenario")
    parser.add_argument("--output", default="prompt_evaluation_results.csv", help="Output CSV file")
    args = parser.parse_args()

    evaluator = PromptEvaluator(prompt_version=args.prompt_version)
    await evaluator.initialize()
    await evaluator.run_evaluation(num_iterations=args.iterations)
    evaluator.generate_report(output_file=args.output)


if __name__ == "__main__":
    asyncio.run(main())

