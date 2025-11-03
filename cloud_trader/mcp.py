from __future__ import annotations

import asyncio
import json
from enum import Enum
from typing import Any, Dict, Optional

import httpx
from pydantic import BaseModel, Field


class MCPMessageType(str, Enum):
    OBSERVATION = "observation"
    PROPOSAL = "proposal"
    CRITIQUE = "critique"
    QUERY = "query"
    RESPONSE = "response"
    CONSENSUS = "consensus"
    EXECUTION = "execution"
    HEARTBEAT = "heartbeat"


class MCPProposalPayload(BaseModel):
    symbol: str
    side: str
    notional: float
    confidence: float
    rationale: str
    constraints: list[str] = Field(default_factory=list)


class MCPResponsePayload(BaseModel):
    reference_id: str
    answer: str
    confidence: float
    supplementary: Optional[Dict[str, Any]] = None


class MCPClient:
    def __init__(self, base_url: str, session_id: str | None = None, *, timeout: float = 10.0) -> None:
        self._base_url = base_url.rstrip("/")
        self._session_id = session_id
        self._client = httpx.AsyncClient(timeout=timeout)
        self._lock = asyncio.Lock()

    async def ensure_session(self) -> str:
        async with self._lock:
            if self._session_id:
                return self._session_id
            resp = await self._client.post(f"{self._base_url}/sessions")
            resp.raise_for_status()
            data = resp.json()
            self._session_id = data.get("session_id")
            return self._session_id

    async def publish(self, message: Dict[str, Any]) -> None:
        session_id = self._session_id or await self.ensure_session()
        payload = json.dumps(message)
        resp = await self._client.post(
            f"{self._base_url}/sessions/{session_id}/messages",
            content=payload,
            headers={"Content-Type": "application/json"},
        )
        resp.raise_for_status()

    async def close(self) -> None:
        await self._client.aclose()


__all__ = [
    "MCPClient",
    "MCPMessageType",
    "MCPProposalPayload",
    "MCPResponsePayload",
]

