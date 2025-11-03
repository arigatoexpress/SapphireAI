#!/usr/bin/env python3
"""Executable entrypoint for the lean cloud trader FastAPI service."""

import argparse
import uvicorn

from cloud_trader.api import build_app
from cloud_trader.logging_config import configure_logging


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the Cloud Trader service")
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=8080)
    parser.add_argument("--log-level", default="info")
    args = parser.parse_args()

    configure_logging(args.log_level)
    app = build_app()
    uvicorn.run(app, host=args.host, port=args.port, log_level=args.log_level, log_config=None)


if __name__ == "__main__":
    main()
