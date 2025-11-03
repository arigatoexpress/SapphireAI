from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect

from .manager import MCPManager
from .schemas import MCPMessage


def get_manager() -> MCPManager:
    return MCPManagerSingleton.manager


class MCPManagerSingleton:
    manager = MCPManager()
    default_session_id: str | None = None


router = APIRouter(prefix="/mcp", tags=["mcp"])


@router.post("/sessions", response_model=dict)
async def create_session(manager: MCPManager = Depends(get_manager)) -> dict:
    session_id = await manager.create_session()
    if MCPManagerSingleton.default_session_id is None:
        MCPManagerSingleton.default_session_id = session_id
    return {"session_id": session_id}


@router.get("/sessions", response_model=dict)
async def list_sessions(manager: MCPManager = Depends(get_manager)) -> dict:
    sessions = await manager.list_sessions()
    return {"sessions": sessions}


@router.post("/sessions/{session_id}/messages", response_model=dict)
async def publish_message(session_id: str, message: MCPMessage, manager: MCPManager = Depends(get_manager)) -> dict:
    sessions = await manager.list_sessions()
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    await manager.broadcast(session_id, message)
    return {"status": "ok"}


@router.websocket("/ws/{session_id}")
async def websocket_endpoint(ws: WebSocket, session_id: str, manager: MCPManager = Depends(get_manager)) -> None:
    await manager.register(session_id, ws)
    try:
        while True:
            data = await ws.receive_json()
            try:
                message = MCPMessage(**data)
            except Exception as exc:
                await ws.send_json({"error": f"invalid message: {exc}"})
                continue
            await manager.broadcast(session_id, message)
    except WebSocketDisconnect:
        await manager.unregister(session_id, ws)
    except Exception:
        await manager.unregister(session_id, ws)
        raise


def get_mcp_router() -> APIRouter:
    return router
