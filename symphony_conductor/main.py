import asyncio
import logging
import os
import time
from typing import Dict, Any

import google.generativeai as genai
from symphony_lib import MarketRegime, MarketRegimeType, SymphonyClient

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("symphony-conductor")

# Configuration
PROJECT_ID = os.getenv("GCP_PROJECT_ID", "sapphire-479610")
SERVICE_NAME = "symphony-conductor"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
ANALYSIS_INTERVAL = int(os.getenv("ANALYSIS_INTERVAL", "60"))  # Seconds

# Initialize Gemini
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    # Debug: List available models
    # try:
    #     logger.info("Listing available Gemini models:")
    #     for m in genai.list_models():
    #         logger.info(f" - {m.name}")
    # except Exception as e:
    #     logger.error(f"Failed to list models: {e}")

    # Using gemini-flash-latest (Stable, High Quota)
    model = genai.GenerativeModel("gemini-flash-latest")
else:
    logger.warning("GEMINI_API_KEY not found. Conductor will run in blind mode.")
    model = None

# Initialize Symphony Client
symphony = SymphonyClient(PROJECT_ID, SERVICE_NAME)

async def analyze_market() -> MarketRegime:
    """
    Analyze the market using Gemini 2.0 Flash.
    In a real scenario, this would fetch data from aggregators.
    For now, we simulate or use basic price feeds if available.
    """
    if not model:
        return MarketRegime(
            regime=MarketRegimeType.UNKNOWN,
            confidence=0.0,
            reasoning="AI Model not initialized"
        )

    try:
        # TODO: Fetch real market data (BTC Price, Funding, VIX)
        # For now, we ask Gemini to hallucinate a regime based on "current crypto sentiment" 
        # (which it knows from its training cutoff, or we feed it data)
        
        # Let's assume we feed it some dummy data for the skeleton
        market_context = "BTC: $95,000. ETH: $3,800. Funding: Positive. VIX: Low."
        
        prompt = f"""
        Analyze the following crypto market context and determine the current regime.
        Context: {market_context}
        
        Regimes:
        - BULL_TRENDING
        - BEAR_TRENDING
        - HIGH_VOLATILITY
        - LOW_VOLATILITY_CHOP
        
        Return JSON:
        {{
            "regime": "REGIME_NAME",
            "confidence": 0.9,
            "reasoning": "Brief explanation"
        }}
        """
        
        response = await asyncio.to_thread(
            model.generate_content, 
            prompt,
            generation_config={"response_mime_type": "application/json"},
            request_options={"timeout": 30}
        )
        
        import json
        result = json.loads(response.text)
        
        return MarketRegime(
            regime=MarketRegimeType(result.get("regime", "UNKNOWN")),
            confidence=result.get("confidence", 0.0),
            reasoning=result.get("reasoning", ""),
            timestamp=time.time()
        )

    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        # Simple backoff handled by caller, but we return UNKNOWN
        return MarketRegime(
            regime=MarketRegimeType.UNKNOWN,
            confidence=0.0,
            reasoning=f"Error: {e}"
        )

async def run_conductor():
    """Main Conductor Loop"""
    logger.info("🎻 Symphony Conductor Starting...")
    
    while True:
        try:
            logger.info("🧠 Analyzing Market...")
            regime = await analyze_market()
            
            logger.info(f"🎼 Publishing Regime: {regime.regime.value} ({regime.confidence:.2f})")
            symphony.publish_regime(regime)
            
            await asyncio.sleep(ANALYSIS_INTERVAL)
            
        except Exception as e:
            logger.error(f"Conductor Loop Error: {e}")
            await asyncio.sleep(10)

from aiohttp import web

async def health_check(request):
    return web.Response(text="OK")

async def start_server():
    app = web.Application()
    app.router.add_get("/", health_check)
    app.router.add_get("/health", health_check)
    runner = web.AppRunner(app)
    await runner.setup()
    port = int(os.getenv("PORT", "8080"))
    site = web.TCPSite(runner, "0.0.0.0", port)
    await site.start()
    logger.info(f"🕸️ Web Server started on port {port}")

async def main():
    # Start Web Server (for Cloud Run Health Checks)
    await start_server()
    
    # Start Conductor Loop
    await run_conductor()

if __name__ == "__main__":
    asyncio.run(main())
