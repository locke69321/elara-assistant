from __future__ import annotations

import asyncio

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.core.middleware import (
    BodySizeLimitMiddleware,
    RateLimitMiddleware,
    RequestTimeoutMiddleware,
)
from app.core.rate_limit import InMemoryRateLimiter


@pytest.mark.unit
def test_request_timeout_middleware_returns_504() -> None:
    app = FastAPI()
    app.add_middleware(RequestTimeoutMiddleware, timeout_seconds=0.001)

    @app.get("/work")
    async def work() -> dict[str, str]:
        await asyncio.sleep(0.01)
        return {"ok": "true"}

    with TestClient(app) as client:
        response = client.get("/work")
    assert response.status_code == 504


@pytest.mark.unit
def test_body_size_limit_middleware_returns_413() -> None:
    app = FastAPI()
    app.add_middleware(BodySizeLimitMiddleware, max_bytes=8)

    @app.post("/upload")
    async def upload() -> dict[str, str]:
        return {"ok": "true"}

    with TestClient(app) as client:
        response = client.post("/upload", content=b"0123456789")
    assert response.status_code == 413


@pytest.mark.unit
def test_rate_limit_middleware_returns_429() -> None:
    app = FastAPI()
    settings = Settings(
        app_rate_limit_window_seconds=60,
        app_rate_limit_requests_per_ip=1,
        app_rate_limit_requests_per_token=1,
    )
    app.add_middleware(
        RateLimitMiddleware,
        settings=settings,
        limiter=InMemoryRateLimiter(),
    )

    @app.get("/secure")
    async def secure() -> dict[str, str]:
        return {"ok": "true"}

    headers = {"Authorization": "Bearer local-dev-token"}
    with TestClient(app) as client:
        first = client.get("/secure", headers=headers)
        second = client.get("/secure", headers=headers)

    assert first.status_code == 200
    assert second.status_code == 429
