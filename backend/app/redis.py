"""Redis client configuration and utilities."""

from typing import Any

import redis
from redis.asyncio import Redis
from redis.exceptions import RedisError

from app.config import settings

# Global Redis client instances
redis_client: Redis | None = None
redis_sync_client: redis.Redis | None = None


async def get_redis() -> Redis:
    """
    Get async Redis client instance.

    Usage in FastAPI routes:
        @router.get("/cached/")
        async def get_cached_data(redis: Redis = Depends(get_redis)):
            value = await redis.get("my_key")
            return {"value": value}
    """
    if redis_client is None:
        msg = "Redis client is not initialized"
        raise RuntimeError(msg)
    return redis_client


def get_redis_sync() -> redis.Redis:
    """
    Get synchronous Redis client instance (for rate limiting).

    Returns:
        Synchronous Redis client
    """
    global redis_sync_client
    if redis_sync_client is None:
        redis_sync_client = redis.from_url(
            str(settings.REDIS_URL),
            encoding="utf-8",
            decode_responses=True,
            max_connections=10,
        )
    return redis_sync_client


async def init_redis() -> None:
    """Initialize Redis connection pools."""
    global redis_client, redis_sync_client
    redis_client = Redis.from_url(
        str(settings.REDIS_URL),
        encoding="utf-8",
        decode_responses=True,
        max_connections=10,
    )
    # Initialize sync client too
    redis_sync_client = redis.from_url(
        str(settings.REDIS_URL),
        encoding="utf-8",
        decode_responses=True,
        max_connections=10,
    )


async def close_redis() -> None:
    """Close Redis connections."""
    import asyncio
    global redis_client, redis_sync_client

    if redis_client:
        try:
            # Check if event loop is still running
            loop = asyncio.get_event_loop()
            if not loop.is_closed():
                await redis_client.aclose()
        except Exception:
            # If event loop is closed or any error, just set to None
            pass
        redis_client = None

    if redis_sync_client:
        try:
            redis_sync_client.close()
        except Exception:
            pass
        redis_sync_client = None


async def check_redis_connection() -> dict[str, Any]:
    """Check Redis connection for health endpoint."""
    try:
        if redis_client is None:
            return {"status": "unhealthy", "redis": "not_initialized"}

        await redis_client.ping()
        return {"status": "healthy", "redis": "connected"}
    except RedisError as e:
        return {"status": "unhealthy", "redis": "disconnected", "error": str(e)}


# Cache utilities
class CacheKeys:
    """Redis cache key patterns."""

    # User cache
    USER_BY_ID = "user:id:{user_id}"
    USER_BY_EMAIL = "user:email:{email}"

    # Refresh tokens
    REFRESH_TOKEN = "refresh_token:{token}"

    # Token blacklist
    TOKEN_BLACKLIST = "token:blacklist:{jti}"

    # Rate limiting
    RATE_LIMIT = "rate_limit:{key}:{window}"

    # Session cache
    USER_SESSION = "session:{user_id}"


async def cache_get(key: str) -> str | None:
    """Get value from cache."""
    if redis_client is None:
        return None
    return await redis_client.get(key)


async def cache_set(key: str, value: str, expire: int | None = None) -> None:
    """
    Set value in cache with optional expiration.

    Args:
        key: Cache key
        value: Value to cache
        expire: Expiration time in seconds (None = no expiration)
    """
    if redis_client is None:
        return
    if expire:
        await redis_client.setex(key, expire, value)
    else:
        await redis_client.set(key, value)


async def cache_delete(key: str) -> None:
    """Delete key from cache."""
    if redis_client is None:
        return
    await redis_client.delete(key)


async def cache_exists(key: str) -> bool:
    """Check if key exists in cache."""
    if redis_client is None:
        return False
    return await redis_client.exists(key) > 0


async def increment_rate_limit(key: str, window: int = 60) -> int:
    """
    Increment rate limit counter.

    Args:
        key: Rate limit key
        window: Time window in seconds (default: 60)

    Returns:
        Current count
    """
    if redis_client is None:
        return 0

    pipe = redis_client.pipeline()
    pipe.incr(key)
    pipe.expire(key, window)
    results = await pipe.execute()
    return results[0]


async def check_rate_limit(key: str, limit: int, window: int = 60) -> bool:
    """
    Check if rate limit is exceeded.

    Args:
        key: Rate limit key
        limit: Maximum requests allowed
        window: Time window in seconds (default: 60)

    Returns:
        True if limit is exceeded, False otherwise
    """
    count = await increment_rate_limit(key, window)
    return count > limit
