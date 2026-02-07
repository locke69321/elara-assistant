import importlib
import os
from collections.abc import Generator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


def _configure_env(db_path: Path) -> None:
    os.environ["APP_DB_URL"] = f"sqlite:///{db_path}"
    os.environ["APP_DB_ENGINE"] = "sqlite"
    os.environ["APP_AUTH_TOKEN"] = "test-token"
    os.environ["APP_CORS_ORIGINS"] = "http://localhost:3000"
    os.environ["APP_VECTOR_DIMENSIONS"] = "8"


@pytest.fixture()
def client(tmp_path: Path) -> Generator[TestClient, None, None]:
    db_path = tmp_path / "test.db"
    _configure_env(db_path)

    from app.core.config import get_settings
    from app.infra.db.session import reset_db_engine_for_tests

    get_settings.cache_clear()
    reset_db_engine_for_tests()

    import app.main as app_main

    importlib.reload(app_main)

    with TestClient(app_main.app) as test_client:
        yield test_client


@pytest.fixture()
def auth_headers() -> dict[str, str]:
    return {"Authorization": "Bearer test-token"}
