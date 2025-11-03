from __future__ import annotations

import asyncio
import json
import contextlib
from typing import Any, Awaitable, Callable, Dict, Optional

import httpx


HandleQueryCallable = Callable[[Dict[str, Any]], Awaitable[Dict[str, Any]]]


class MCPAdapter:
    """Lightweight MCP client for model services."""

    def __init__(
        self,
        base_url: Optional[str],
        agent_id: str,
        session_id: Optional[str] = None,
        *,
        handle_query: Optional[HandleQueryCallable] = None,
        timeout: float = 10.0,
    ) -> None:
        self._base_url = base_url.rstrip("/") if base_url else None
        self._agent_id = agent_id
        self._session_id = session_id
        self._handle_query = handle_query
        self._client: Optional[httpx.AsyncClient] = None
        self._lock = asyncio.Lock()
        self._listener_task: Optional[asyncio.Task[None]] = None
        self._stopped = asyncio.Event()
        self._timeout = timeout

    async def start(self) -> None:
        if not self._base_url:
            return
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=self._timeout)
        await self._ensure_session()
        self._stopped.clear()
        self._listener_task = asyncio.create_task(self._listen_loop())

    async def stop(self) -> None:
        if self._listener_task:
            self._listener_task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self._listener_task
        self._listener_task = None
        if self._client:
            await self._client.aclose()
        self._client = None
        self._stopped.set()

    async def publish_proposal(
        self,
        symbol: str,
        side: str,
        notional: float,
        confidence: float,
        rationale: str,
        constraints: Optional[list[str]] = None,
    ) -> None:
        if not self._base_url:
            return
        payload = {
            "symbol": symbol,
            "side": side,
            "notional": notional,
            "confidence": confidence,
            "rationale": rationale,
            "constraints": constraints or [],
        }
        await self._publish("proposal", payload)

    async def publish_response(
        self,
        reference_id: str,
        answer: str,
        confidence: float,
        supplementary: Optional[Dict[str, Any]] = None,
    ) -> None:
        if not self._base_url:
            return
        payload = {
            "reference_id": reference_id,
            "answer": answer,
            "confidence": confidence,
            "supplementary": supplementary or {},
        }
        await self._publish("response", payload)

    async def _publish(self, message_type: str, payload: Dict[str, Any]) -> None:
        session_id = await self._ensure_session()
        if not self._client or not self._base_url:
            return
        message = {
            "session_id": session_id,
            "sender_id": self._agent_id,
            "sender_role": "agent",
            "message_type": message_type,
            "payload": payload,
        }
        url = f"{self._base_url}/sessions/{session_id}/messages"
        resp = await self._client.post(url, json=message)
        resp.raise_for_status()

    async def _ensure_session(self) -> str:
        if self._session_id:
            return self._session_id
        if not self._client or not self._base_url:
            raise RuntimeError("MCP client not initialized")
        async with self._lock:
            if self._session_id:
                return self._session_id
            resp = await self._client.post(f"{self._base_url}/sessions")
            resp.raise_for_status()
            data = resp.json()
            self._session_id = data.get("session_id")
        return self._session_id

    async def _listen_loop(self) -> None:
        if not self._client or not self._base_url:
            return
        session_id = await self._ensure_session()
        ws_url = self._base_url.replace("http", "ws", 1) + f"/ws/{session_id}"
        while not self._stopped.is_set():
            try:
                async with self._client.ws_connect(ws_url) as ws:
                    async for event in ws:
                        if event.type != "text":
                            continue
                        data = json.loads(event.text)
                        message = data.get("message", {})
                        if message.get("sender_id") == self._agent_id:
                            continue
                        if message.get("message_type") == "query" and self._handle_query:
                            payload = message.get("payload", {})
                            try:
                                reply = await self._handle_query(payload)
                                await self.publish_response(
                                    reference_id=payload.get("reference_id", ""),
                                    answer=reply.get("answer", ""),
                                    confidence=reply.get("confidence", 0.0),
                                    supplementary=reply.get("supplementary", {}),
                                )
                            except Exception:
                                continue
            except Exception:
                await asyncio.sleep(2)


__all__ = ["MCPAdapter"]

