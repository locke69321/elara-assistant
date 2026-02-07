import logging
from collections.abc import Awaitable, Callable

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.responses import Response

from app.api.router import router
from app.core.config import get_settings
from app.core.logging import configure_logging
from app.core.middleware import (
    BodySizeLimitMiddleware,
    RateLimitMiddleware,
    RequestTimeoutMiddleware,
)
from app.core.rate_limit import InMemoryRateLimiter
from app.core.security import ensure_authorized
from app.infra.db.session import init_db

configure_logging()
logger = logging.getLogger(__name__)
settings = get_settings()

app = FastAPI(title="Elara Nexus Backend", version="0.0.1")

app.add_middleware(RequestTimeoutMiddleware, timeout_seconds=settings.app_request_timeout_seconds)
app.add_middleware(BodySizeLimitMiddleware, max_bytes=settings.app_max_request_body_bytes)
app.add_middleware(RateLimitMiddleware, settings=settings, limiter=InMemoryRateLimiter())
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def auth_middleware(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    try:
        ensure_authorized(request, settings)
    except HTTPException as exc:
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
    return await call_next(request)


@app.exception_handler(Exception)
async def handle_unexpected(_request: Request, exc: Exception) -> JSONResponse:
    logger.exception("unexpected_exception", exc_info=exc)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.on_event("startup")
def on_startup() -> None:
    init_db()


app.include_router(router)
