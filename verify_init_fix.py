
import sys
import os
from unittest.mock import MagicMock

# Set path
sys.path.insert(0, "/Users/aribs/AIAster")

# Top-level mocks to bypass missing dependencies
for lib in ["google", "google.cloud", "google.cloud.pubsub_v1", "redis", "aiohttp", "websockets", "symphony_lib"]:
    sys.modules[lib] = MagicMock()

# Specific mocks to handle "from .X import Y"
sys.modules["symphony_lib"].SymphonyClient = MagicMock
sys.modules["symphony_lib"].MarketRegime = MagicMock

# Mock internal modules that might be complex
sys.modules["cloud_trader.enhanced_telegram"] = MagicMock()
sys.modules["cloud_trader.grok_manager"] = MagicMock()
sys.modules["cloud_trader.exchange"] = MagicMock()
sys.modules["cloud_trader.position_manager"] = MagicMock()
sys.modules["cloud_trader.market_data"] = MagicMock()
# We need definitions for MinimalAgentState if used in type hints?
# Python runtime generally ignores type hint imports if from __future__ import annotations is used, 
# or if they are just names.

print("Starting verification...")

try:
    # Try importing
    from cloud_trader.trading_service import MinimalTradingService
    print("✅ Imported MinimalTradingService")

    # Set dummy env vars for init
    os.environ["REDIS_URL"] = "redis://mock"
    
    # Instantiate
    # We need to mock settings if __init__ uses it?
    # __init__ signature: def __init__(self, settings: Optional[Settings] = None):
    # It calls get_settings() if None.
    # We should mock config too.
    sys.modules["cloud_trader.config"] = MagicMock()
    sys.modules["cloud_trader.config"].get_settings.return_value = MagicMock(
        enable_telegram=False,
        grok_api_key="dummy",
        gcp_project_id="dummy-project"
    )

    service = MinimalTradingService()
    print("✅ Instantiated MinimalTradingService")

    # Verify attributes that were missing before
    attrs_to_check = ["symphony", "_redis_client", "_grok_manager", "position_manager"]
    missing = []
    found = []
    
    for attr in attrs_to_check:
        if hasattr(service, attr):
            val = getattr(service, attr)
            print(f"   - {attr}: Found ({val})")
            found.append(attr)
        else:
            print(f"   - {attr}: MISSING")
            missing.append(attr)

    if not missing:
        print("\n🎉 SUCCESS: All expected attributes initialized.")
    else:
        print(f"\n❌ FAILURE: Missing attributes: {missing}")

except ImportError as e:
    print(f"❌ Import Error: {e}")
except Exception as e:
    print(f"❌ Runtime Error: {e}")
    import traceback
    traceback.print_exc()
