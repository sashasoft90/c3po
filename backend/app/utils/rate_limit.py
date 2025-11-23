"""Rate limiting utilities using slowapi and Redis."""

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import settings


def _redis_key_func(request):
    """Custom key function for Redis-based rate limiting."""
    # Use a combination of IP and user ID if authenticated
    remote_addr = get_remote_address(request)

    # Try to get user from request state (set by auth dependency)
    user_id = getattr(request.state, "user_id", None)
    if user_id:
        return f"{remote_addr}:{user_id}"

    return remote_addr


# Initialize limiter with Redis storage
limiter = Limiter(
    key_func=_redis_key_func,
    storage_uri=str(settings.REDIS_URL),
    default_limits=[f"{settings.RATE_LIMIT_PER_MINUTE}/minute"],
)
