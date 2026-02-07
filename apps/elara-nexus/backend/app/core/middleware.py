import logging
from collections.abc import Awaitable, Callable

import anyio
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from starlette.types import ASGIApp, Receive, Scope, Send

from app.core.config import Settings
from app.core.rate_limit import InMemoryRateLimiter
from app.core.security import EXEMPT_PATHS, extract_bearer_token

logger = logging.getLogger(__name__)


class RequestTimeoutMiddleware:
    def __init__(self, app: ASGIApp, timeout_seconds: float) -> None:
        self.app = app
        self.timeout_seconds = timeout_seconds

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        try:
            with anyio.fail_after(self.timeout_seconds):
                await self.app(scope, receive, send)
        except TimeoutError:
            response = JSONResponse(status_code=504, content={"detail": "Request timeout"})
            await response(scope, receive, send)


class BodySizeLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp, max_bytes: int) -> None:
        super().__init__(app)
        self.max_bytes = max_bytes

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                if int(content_length) > self.max_bytes:
                    return JSONResponse(status_code=413, content={"detail": "Payload too large"})
            except ValueError:
                return JSONResponse(status_code=400, content={"detail": "Invalid Content-Length"})

        body = await request.body()
        if len(body) > self.max_bytes:
            return JSONResponse(status_code=413, content={"detail": "Payload too large"})

        return await call_next(request)


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp, settings: Settings, limiter: InMemoryRateLimiter) -> None:
        super().__init__(app)
        self.settings = settings
        self.limiter = limiter

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        if request.url.path in EXEMPT_PATHS:
            return await call_next(request)

        ip = request.client.host if request.client else "unknown"
        token = extract_bearer_token(request) or "anonymous"

        ip_ok = self.limiter.allow(
            key=f"ip:{ip}",
            window_seconds=self.settings.app_rate_limit_window_seconds,
            limit=self.settings.app_rate_limit_requests_per_ip,
        )
        if not ip_ok:
            logger.warning("rate_limit_exceeded", extra={"audit": {"ip": ip, "token": token[:6]}})
            return JSONResponse(status_code=429, content={"detail": "Rate limit exceeded"})

        token_ok = self.limiter.allow(
            key=f"token:{token}",
            window_seconds=self.settings.app_rate_limit_window_seconds,
            limit=self.settings.app_rate_limit_requests_per_token,
        )
        if not token_ok:
            logger.warning("rate_limit_exceeded", extra={"audit": {"ip": ip, "token": token[:6]}})
            return JSONResponse(status_code=429, content={"detail": "Rate limit exceeded"})

        return await call_next(request)
