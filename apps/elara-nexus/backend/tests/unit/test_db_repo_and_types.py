from __future__ import annotations

from collections.abc import Generator

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.domain.types import RunStatus, TaskPriority, TaskStatus
from app.infra.db.models import Base
from app.infra.db.types import EmbeddingType
from app.repositories.interfaces import BoardRepository, TaskRepository
from app.repositories.sqlalchemy_repo import SqlAlchemyRepository, cosine_similarity


@pytest.fixture()
def session() -> Generator[Session, None, None]:
    engine = create_engine("sqlite+pysqlite:///:memory:", future=True)
    Base.metadata.create_all(bind=engine)
    local = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)
    db = local()
    try:
        yield db
    finally:
        db.close()
        engine.dispose()


@pytest.mark.unit
def test_embedding_type_handles_sqlite_and_postgres_dialects() -> None:
    embedding = EmbeddingType(dimensions=8)
    sqlite_engine = create_engine("sqlite+pysqlite:///:memory:", future=True)
    postgres_engine = create_engine(
        "postgresql+psycopg://postgres:postgres@localhost/postgres",
        future=True,
    )
    sqlite_type = embedding.load_dialect_impl(sqlite_engine.dialect)
    postgres_type = embedding.load_dialect_impl(postgres_engine.dialect)
    sqlite_engine.dispose()
    postgres_engine.dispose()

    assert sqlite_type is not None
    assert str(postgres_type).lower().startswith("vector")
    assert embedding.process_bind_param([1, 2, 3], sqlite_engine.dialect) == [1.0, 2.0, 3.0]
    assert embedding.process_result_value([1, 2, 3], sqlite_engine.dialect) == [1.0, 2.0, 3.0]
    assert embedding.process_result_value(None, sqlite_engine.dialect) is None


@pytest.mark.unit
def test_repository_protocols_are_importable() -> None:
    board_type_name = BoardRepository.__name__
    task_type_name = TaskRepository.__name__
    assert board_type_name == "BoardRepository"
    assert task_type_name == "TaskRepository"


@pytest.mark.unit
def test_sqlalchemy_repository_core_flows(session: Session) -> None:
    repo = SqlAlchemyRepository(session)

    board = repo.ensure_default_board()
    same_board = repo.ensure_default_board()
    assert board.id == same_board.id

    columns = repo.get_columns(board.id)
    assert len(columns) == 6
    first_column = columns[0]
    assert repo.get_column(first_column.id) is not None
    assert repo.patch_board("missing", "noop") is None

    task = repo.create_task(
        board_id=board.id,
        column_id=first_column.id,
        title="Task",
        description="desc",
        priority=TaskPriority.p1,
        status=TaskStatus.todo,
    )
    assert len(repo.list_tasks(board.id)) == 1
    assert repo.get_task(task.id) is not None
    assert repo.get_task("missing-task") is None

    updated = repo.update_task(
        task.id,
        title="Task 2",
        description=None,
        priority=TaskPriority.p0,
        status=TaskStatus.in_progress,
        column_id=None,
    )
    assert updated is not None
    assert updated.title == "Task 2"
    updated_again = repo.update_task(
        task.id,
        title=None,
        description="description-2",
        priority=None,
        status=None,
        column_id=first_column.id,
    )
    assert updated_again is not None
    assert updated_again.description == "description-2"
    assert repo.update_task("missing-task", None, None, None, None, None) is None
    assert repo.move_task("missing-task", first_column.id, TaskStatus.done) is None

    moved = repo.move_task(task.id, first_column.id, TaskStatus.blocked)
    assert moved is not None
    assert len(repo.task_history(task.id)) >= 3

    chat = repo.create_chat_session("ops")
    user_message = repo.add_chat_message(chat.id, "user", "hello")
    assert len(repo.list_chat_messages(chat.id)) == 1

    run = repo.create_run(
        session_id=chat.id,
        message_id=user_message.id,
        status=RunStatus.running,
        model="gpt-test",
        trace_id="trace-1",
    )
    assert repo.update_run_status(run.id, RunStatus.succeeded) is not None
    assert repo.update_run_status("missing-run", RunStatus.failed) is None

    doc = repo.create_memory_document("Spec", "content", "src")
    repo.add_memory_chunk(doc.id, "chunk", 0, [0.1] * 8)
    triples = repo.list_memory_embeddings()
    assert len(triples) == 1
    assert repo.get_memory_document(doc.id) is not None
    assert repo.get_memory_document("missing-doc") is None


@pytest.mark.unit
def test_cosine_similarity_zero_cases() -> None:
    assert cosine_similarity([], []) == 0.0
    assert cosine_similarity([0.0, 0.0], [1.0, 2.0]) == 0.0
