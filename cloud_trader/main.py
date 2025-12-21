"""Main entrypoint for Cloud Run deployment."""
import os
import sys
import uvicorn

# Add parent directory to path to allow cloud_trader package imports
sys.path.insert(0, os.path.dirname(__file__))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(
        "cloud_trader.api:app",
        host="0.0.0.0",
        port=port,
        workers=1,
        log_level="info",
        access_log=True,
    )
