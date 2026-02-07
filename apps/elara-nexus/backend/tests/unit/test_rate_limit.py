import pytest

from app.core.rate_limit import InMemoryRateLimiter


@pytest.mark.unit
def test_rate_limit_denies_after_limit() -> None:
    limiter = InMemoryRateLimiter()
    key = "token:abc"
    assert limiter.allow(key, window_seconds=60, limit=2)
    assert limiter.allow(key, window_seconds=60, limit=2)
    assert not limiter.allow(key, window_seconds=60, limit=2)
