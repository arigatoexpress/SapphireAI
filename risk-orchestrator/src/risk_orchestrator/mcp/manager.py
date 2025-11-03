from __future__ import annotations

import asyncio
import uuid
from collections import defaultdict
from typing import Dict, List, Set

from fastapi import WebSocket

from .schemas import MCPMessage, MCPMessageEnvelope, MCPMessageType


class MCPManager:
    """Coordinates multi-agent collaboration sessions."""

    def __init__(self) -> None:
        self._session_connections: Dict[str, Set[WebSocket]] = defaultdict(set)
        self._session_history: Dict[str, List[MCPMessageEnvelope]] = defaultdict(list)
        self._lock = asyncio.Lock()

    async def create_session(self) -> str:
        session_id = uuid.uuid4().hex
        async with self._lock:
            self._session_connections[session_id]
            self._session_history[session_id]
        return session_id

    async def list_sessions(self) -> List[str]:
        async with self._lock:
            return list(self._session_connections.keys())

    async def register(self, session_id: str, ws: WebSocket) -> None:
        await ws.accept()
        async with self._lock:
            if session_id not in self._session_connections:
                self._session_connections[session_id] = set()
                self._session_history[session_id] = []
            self._session_connections[session_id].add(ws)

        # Replay last 50 messages to new participant
        history = self._session_history.get(session_id, [])[-50:]
        for envelope in history:
            await ws.send_json(envelope.model_dump())

    async def unregister(self, session_id: str, ws: WebSocket) -> None:
        async with self._lock:
            connections = self._session_connections.get(session_id)
            if connections and ws in connections:
                connections.remove(ws)
            if connections is not None and len(connections) == 0:
                self._session_connections.pop(session_id, None)
                self._session_history.pop(session_id, None)

    async def broadcast(self, session_id: str, message: MCPMessage) -> None:
        envelope = MCPMessageEnvelope(message=message)
        async with self._lock:
            if session_id not in self._session_connections:
                self._session_connections[session_id] = set()
            self._session_history[session_id].append(envelope)
            connections = list(self._session_connections[session_id])

        for connection in connections:
            try:
                await connection.send_json(envelope.model_dump())
            except Exception:
                await self.unregister(session_id, connection)

    async def broadcast_system_event(self, session_id: str, payload: dict) -> None:
        message = MCPMessage(
            session_id=session_id,
            sender_id="mcp-coordinator",
            sender_role="coordinator",
            message_type=MCPMessageType.HEARTBEAT,
            payload=payload,
        )
        await self.broadcast(session_id, message)
