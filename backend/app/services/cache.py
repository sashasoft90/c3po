"""Cache service for Redis operations."""

import json
from typing import Any

from loguru import logger

from app.redis import get_redis


class CacheService:
    """Service for caching data in Redis."""

    def __init__(self, prefix: str = "cache"):
        """
        Initialize cache service.

        Args:
            prefix: Key prefix for namespacing cache entries
        """
        self.prefix = prefix

    def _make_key(self, key: str) -> str:
        """
        Create prefixed cache key.

        Args:
            key: Original key

        Returns:
            Prefixed key
        """
        return f"{self.prefix}:{key}"

    async def get(self, key: str) -> Any | None:
        """
        Get value from cache.

        Args:
            key: Cache key

        Returns:
            Cached value or None if not found
        """
        try:
            redis = await get_redis()
            value = await redis.get(self._make_key(key))
            if value is None:
                return None

            # Try to decode JSON
            try:
                return json.loads(value)
            except (json.JSONDecodeError, TypeError):
                return value.decode() if isinstance(value, bytes) else value

        except Exception as e:
            logger.error(f"Failed to get cache key {key}: {str(e)}")
            return None

    async def set(self, key: str, value: Any, expire: int | None = None) -> bool:
        """
        Set value in cache.

        Args:
            key: Cache key
            value: Value to cache
            expire: Expiration time in seconds (None for no expiration)

        Returns:
            True if successful
        """
        try:
            redis = await get_redis()

            # Serialize value
            if isinstance(value, (dict, list, tuple)):
                serialized = json.dumps(value)
            elif isinstance(value, (str, int, float, bool)):
                serialized = json.dumps(value)
            else:
                serialized = str(value)

            # Set with or without expiration
            if expire:
                await redis.setex(self._make_key(key), expire, serialized)
            else:
                await redis.set(self._make_key(key), serialized)

            logger.debug(f"Cached key {key} with expiration {expire}s")
            return True

        except Exception as e:
            logger.error(f"Failed to set cache key {key}: {str(e)}")
            return False

    async def delete(self, key: str) -> bool:
        """
        Delete key from cache.

        Args:
            key: Cache key

        Returns:
            True if key was deleted
        """
        try:
            redis = await get_redis()
            result = await redis.delete(self._make_key(key))
            return bool(result)
        except Exception as e:
            logger.error(f"Failed to delete cache key {key}: {str(e)}")
            return False

    async def exists(self, key: str) -> bool:
        """
        Check if key exists in cache.

        Args:
            key: Cache key

        Returns:
            True if key exists
        """
        try:
            redis = await get_redis()
            result = await redis.exists(self._make_key(key))
            return bool(result)
        except Exception as e:
            logger.error(f"Failed to check cache key {key}: {str(e)}")
            return False

    async def clear_pattern(self, pattern: str) -> int:
        """
        Delete all keys matching pattern.

        Args:
            pattern: Key pattern (e.g., "user:*")

        Returns:
            Number of keys deleted
        """
        try:
            redis = await get_redis()
            full_pattern = self._make_key(pattern)

            # Scan for matching keys
            keys = []
            cursor = 0
            while True:
                cursor, batch = await redis.scan(cursor, match=full_pattern, count=100)
                keys.extend(batch)
                if cursor == 0:
                    break

            # Delete all matching keys
            if keys:
                deleted = await redis.delete(*keys)
                logger.info(f"Deleted {deleted} keys matching pattern {pattern}")
                return deleted
            return 0

        except Exception as e:
            logger.error(f"Failed to clear cache pattern {pattern}: {str(e)}")
            return 0

    async def get_ttl(self, key: str) -> int | None:
        """
        Get time-to-live for a key.

        Args:
            key: Cache key

        Returns:
            TTL in seconds, -1 if key has no expiration, None if key doesn't exist
        """
        try:
            redis = await get_redis()
            ttl = await redis.ttl(self._make_key(key))
            if ttl == -2:  # Key doesn't exist
                return None
            return ttl
        except Exception as e:
            logger.error(f"Failed to get TTL for key {key}: {str(e)}")
            return None

    async def increment(self, key: str, amount: int = 1) -> int | None:
        """
        Increment a numeric value in cache.

        Args:
            key: Cache key
            amount: Amount to increment by

        Returns:
            New value after increment, or None on error
        """
        try:
            redis = await get_redis()
            value = await redis.incrby(self._make_key(key), amount)
            return value
        except Exception as e:
            logger.error(f"Failed to increment key {key}: {str(e)}")
            return None

    async def decrement(self, key: str, amount: int = 1) -> int | None:
        """
        Decrement a numeric value in cache.

        Args:
            key: Cache key
            amount: Amount to decrement by

        Returns:
            New value after decrement, or None on error
        """
        try:
            redis = await get_redis()
            value = await redis.decrby(self._make_key(key), amount)
            return value
        except Exception as e:
            logger.error(f"Failed to decrement key {key}: {str(e)}")
            return None


# Global cache service instances
cache_service = CacheService(prefix="cache")
session_cache = CacheService(prefix="session")
rate_limit_cache = CacheService(prefix="ratelimit")
