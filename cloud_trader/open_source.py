"""Open-source analyst integrations (FinGPT, Lag-LLaMA) for trade reasoning."""

from __future__ import annotations

import asyncio
import logging
import time
from typing import Any, Dict, Optional

import httpx

from .config import Settings
from .sui_clients import SuiNautilusClient, SuiSealClient, SuiWalrusClient

logger = logging.getLogger(__name__)


class OpenSourceAnalyst:
    """Asynchronous helper that calls optional FinGPT and Lag-LLaMA services."""

    _MIN_INTERVAL_SECONDS = {
        "fingpt-alpha": 2.0,
        "lagllama-visionary": 2.0,
    }

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._rate_state: Dict[str, float] = {}
        self._rate_lock = asyncio.Lock()
        # Sui decentralized science hooks (populated once endpoints are configured)
        self._walrus = SuiWalrusClient()
        self._seal = SuiSealClient()
        self._nautilus = SuiNautilusClient()

    async def generate_thesis(
        self,
        agent_id: Optional[str],
        symbol: str,
        side: str,
        price: float,
        market_context: Dict[str, Any],
    ) -> Optional[Dict[str, Any]]:
        if not agent_id:
            return None

        if agent_id == "fingpt-alpha":
            return await self._query_fingpt(symbol, side, price, market_context)

        if agent_id == "lagllama-visionary":
            return await self._query_lagllama(symbol, side, price, market_context)

        return None

    async def _query_fingpt(
        self,
        symbol: str,
        side: str,
        price: float,
        market_context: Dict[str, Any],
    ) -> Optional[Dict[str, Any]]:
        if not await self._allow_request("fingpt-alpha"):
            logger.debug("FinGPT request throttled for %s", symbol)
            return None

        endpoint = self._settings.fingpt_endpoint
        if not endpoint:
            return self._fallback_fingpt(symbol, side, price, market_context)

        payload = {
            "model": "FinGPT",
            "prompt": self._build_prompt(symbol, side, price, market_context, "FinGPT"),
            # TODO: attach Walrus content IDs once encrypted community research is stored
        }

        data = await self._post_json(endpoint, payload, self._settings.fingpt_api_key, "FinGPT")
        if not data:
            return self._fallback_fingpt(symbol, side, price, market_context)

        thesis = data.get("thesis") or data.get("summary") or data.get("text")
        risk_score = data.get("risk_score")
        confidence = data.get("confidence")

        if isinstance(thesis, str):
            thesis = thesis.strip()

        if not thesis:
            return self._fallback_fingpt(symbol, side, price, market_context)

        return {
            "source": "FinGPT",
            "thesis": thesis,
            "risk_score": float(risk_score) if isinstance(risk_score, (int, float)) else None,
            "confidence": float(confidence) if isinstance(confidence, (int, float)) else None,
        }

    async def _query_lagllama(
        self,
        symbol: str,
        side: str,
        price: float,
        market_context: Dict[str, Any],
    ) -> Optional[Dict[str, Any]]:
        if not await self._allow_request("lagllama-visionary"):
            logger.debug("Lag-LLaMA request throttled for %s", symbol)
            return None

        endpoint = self._settings.lagllama_endpoint
        if not endpoint:
            return self._fallback_lagllama(symbol, side, price, market_context)

        payload = {
            "model": "lag-llama",
            "symbol": symbol,
            "side": side,
            "price": price,
            "context": market_context,
            # TODO: include Nautilus telemetry handles when Sui streams are available
        }

        data = await self._post_json(endpoint, payload, self._settings.lagllama_api_key, "Lag-LLaMA")
        if not data:
            return self._fallback_lagllama(symbol, side, price, market_context)

        forecast = data.get("forecast") or []
        upper_ci = data.get("upper_ci") or []
        lower_ci = data.get("lower_ci") or []
        anomaly_score = data.get("anomaly_score")
        confidence = data.get("confidence")

        ci_span = self._compute_ci_span(price, upper_ci, lower_ci)

        thesis = data.get("thesis")
        if not isinstance(thesis, str):
            thesis = self._format_lagllama_thesis(symbol, side, price, forecast, upper_ci, lower_ci, anomaly_score)

        return {
            "source": "Lag-LLaMA",
            "thesis": thesis,
            "ci_span": ci_span,
            "anomaly_score": float(anomaly_score) if isinstance(anomaly_score, (int, float)) else None,
            "confidence": float(confidence) if isinstance(confidence, (int, float)) else None,
        }

    async def _post_json(
        self,
        endpoint: str,
        payload: Dict[str, Any],
        api_key: Optional[str],
        label: str,
    ) -> Optional[Dict[str, Any]]:
        headers = {"Content-Type": "application/json"}
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"

        try:
            async with httpx.AsyncClient(timeout=self._settings.llm_timeout_seconds) as client:
                response = await client.post(endpoint, json=payload, headers=headers)
                response.raise_for_status()
                data = response.json()
                if isinstance(data, dict):
                    return data
                logger.debug("%s analyst returned non-dict payload", label)
        except Exception as exc:
            logger.debug("%s analyst call failed: %s", label, exc)
        return None

    async def _allow_request(self, key: str) -> bool:
        interval = self._MIN_INTERVAL_SECONDS.get(key, 1.0)
        async with self._rate_lock:
            now = time.monotonic()
            last = self._rate_state.get(key, 0.0)
            if now - last < interval:
                return False
            self._rate_state[key] = now
            return True

    @staticmethod
    def _build_prompt(
        symbol: str,
        side: str,
        price: float,
        market_context: Dict[str, Any],
        model_name: str,
    ) -> str:
        change = market_context.get("change_24h", 0)
        volume = market_context.get("volume", 0)
        atr = market_context.get("atr")
        return (
            f"You are {model_name}, an open-source model aiding a privacy-preserving trader. "
            f"Generate a concise thesis for {side.upper()} {symbol} near {price:.4f}. "
            f"24h change: {change:.2f}%, volume: {volume:.0f}. ATR: {atr if atr is not None else 'n/a'}. "
            "Return JSON with fields thesis (string), risk_score (0-1), confidence (0-1)."
        )

    @staticmethod
    def _compute_ci_span(price: float, upper_ci: list[Any], lower_ci: list[Any]) -> Optional[float]:
        if not upper_ci or not lower_ci:
            return None
        try:
            max_diff = max(float(u) - float(l) for u, l in zip(upper_ci, lower_ci))
            if price > 0:
                return max_diff / price
        except Exception:
            return None
        return None

    @staticmethod
    def _format_lagllama_thesis(
        symbol: str,
        side: str,
        price: float,
        forecast: list[Any],
        upper_ci: list[Any],
        lower_ci: list[Any],
        anomaly_score: Optional[Any],
    ) -> str:
        try:
            next_price = float(forecast[0]) if forecast else price
            upper = float(upper_ci[0]) if upper_ci else next_price
            lower = float(lower_ci[0]) if lower_ci else next_price
            anomaly = float(anomaly_score) if isinstance(anomaly_score, (int, float)) else None
        except Exception:
            next_price, upper, lower, anomaly = price, price, price, None

        bias = "upside" if next_price >= price else "downside"
        anomaly_text = f" Anomaly score {anomaly:.2f}." if anomaly is not None else ""
        return (
            f"Lag-LLaMA forecast for {symbol}: {bias} bias with next target {next_price:.4f}. "
            f"Confidence band [{lower:.4f}, {upper:.4f}].{anomaly_text}"
        )

    @staticmethod
    def _fallback_fingpt(
        symbol: str,
        side: str,
        price: float,
        market_context: Dict[str, Any],
    ) -> Dict[str, Any]:
        change = market_context.get("change_24h", 0)
        volume = market_context.get("volume", 0)
        thesis = (
            f"FinGPT heuristic for {symbol}: {side.upper()} near {price:.4f}. "
            f"24h change {change:+.2f}%, volume {volume:.0f}. Maintain tight stops and respect leverage limits."
        )
        return {
            "source": "FinGPT",
            "thesis": thesis,
            "risk_score": 0.5,
            "confidence": 0.5,
        }

    @staticmethod
    def _fallback_lagllama(
        symbol: str,
        side: str,
        price: float,
        market_context: Dict[str, Any],
    ) -> Dict[str, Any]:
        change = market_context.get("change_24h", 0)
        thesis = (
            f"Lag-LLaMA heuristic for {symbol}: {side.upper()} near {price:.4f}. "
            f"Momentum {change:+.2f}% 24h. Monitor spreads and adjust exposure if volatility widens."
        )
        return {
            "source": "Lag-LLaMA",
            "thesis": thesis,
            "ci_span": None,
            "anomaly_score": None,
            "confidence": 0.4,
        }


