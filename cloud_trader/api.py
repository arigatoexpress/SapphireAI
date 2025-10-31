"""FastAPI surface for controlling the trading service."""

from __future__ import annotations

import asyncio
from typing import Dict

from fastapi import FastAPI, HTTPException

from .service import TradingService


def build_app(service: TradingService | None = None) -> FastAPI:
    trading_service = service or TradingService()
    app = FastAPI(title="Cloud Trader", version="1.0")

    @app.get("/healthz")
    async def healthz() -> Dict[str, object]:
        status = trading_service.health()
        return {
            "running": status.running,
            "paper_trading": status.paper_trading,
            "last_error": status.last_error,
        }

    @app.post("/start")
    async def start() -> Dict[str, str]:
        asyncio.create_task(trading_service.start())
        return {"status": "starting"}

    @app.post("/stop")
    async def stop() -> Dict[str, str]:
        if not trading_service.health().running:
            raise HTTPException(status_code=400, detail="Service not running")
        asyncio.create_task(trading_service.stop())
        return {"status": "stopping"}

    return app
