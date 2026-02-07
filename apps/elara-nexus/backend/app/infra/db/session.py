import logging
from collections.abc import Generator
from functools import lru_cache

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings
from app.infra.db.models import Base

logger = logging.getLogger(__name__)


def build_engine() -> Engine:
    settings = get_settings()
    connect_args = {"check_same_thread": False} if settings.app_db_url.startswith("sqlite") else {}
    return create_engine(settings.app_db_url, future=True, connect_args=connect_args)


@lru_cache
def get_engine() -> Engine:
    return build_engine()


@lru_cache
def get_session_factory() -> sessionmaker[Session]:
    return sessionmaker(
        bind=get_engine(), autoflush=False, autocommit=False, expire_on_commit=False
    )


def init_db() -> None:
    settings = get_settings()
    engine = get_engine()
    with engine.begin() as conn:
        if settings.is_postgres:
            try:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            except Exception as exc:  # pragma: no cover - depends on DB image capabilities
                logger.warning("pgvector_extension_unavailable", extra={"error": str(exc)})
    Base.metadata.create_all(bind=engine)


def get_db_session() -> Generator[Session, None, None]:
    session = get_session_factory()()
    try:
        yield session
    finally:
        session.close()


def reset_db_engine_for_tests() -> None:
    get_session_factory.cache_clear()
    get_engine.cache_clear()
