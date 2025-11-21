"""Standalone health check functions for self-healing system."""

import logging

from sqlalchemy import text

logger = logging.getLogger(__name__)


async def check_database_health() -> bool:
    """Standalone database health check function."""
    try:
        from .storage import get_storage

        storage = await get_storage()
        if storage and storage.is_ready():
            # Try a simple SQL query that doesn't depend on existing tables
            async with storage._session_factory() as session:
                await session.execute(text("SELECT 1"))
            return True
        return False
    except Exception as e:
        logger.debug(f"Database health check failed: {e}")
        return False


async def check_redis_health() -> bool:
    """Standalone Redis health check function."""
    try:
        from .cache import get_cache

        cache = await get_cache()
        if cache and cache.is_connected():
            # Try a simple set/get operation
            test_key = "health_check_test"
            await cache.set(test_key, "test", ttl=10)
            result = await cache.get(test_key)
            return result == "test"
        return False
    except Exception as e:
        logger.debug(f"Redis health check failed: {e}")
        return False
