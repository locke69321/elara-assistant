from dataclasses import dataclass

from fastapi import HTTPException, Request, status

from app.core.config import Settings

EXEMPT_PATHS = {
    "/api/v1/health",
    "/api/v1/ready",
    "/openapi.json",
    "/docs",
    "/docs/oauth2-redirect",
    "/redoc",
}


@dataclass(slots=True)
class AuthContext:
    token: str


def extract_bearer_token(request: Request) -> str:
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return ""
    return header[7:].strip()


def ensure_authorized(request: Request, settings: Settings) -> AuthContext:
    if request.url.path in EXEMPT_PATHS:
        return AuthContext(token="")

    token = extract_bearer_token(request)
    if not token or token != settings.app_auth_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
    return AuthContext(token=token)
