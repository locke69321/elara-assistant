from __future__ import annotations

from datetime import UTC, datetime
from types import SimpleNamespace
from typing import cast

import pytest

from app.domain.types import TaskPriority, TaskStatus
from app.repositories.sqlalchemy_repo import SqlAlchemyRepository
from app.services.board_service import BoardService


def _task(status: TaskStatus = TaskStatus.todo) -> SimpleNamespace:
    now = datetime.now(UTC)
    return SimpleNamespace(
        id="task-1",
        board_id="board-1",
        column_id="col-1",
        title="T",
        description="D",
        priority=TaskPriority.p2.value,
        status=status.value,
        created_at=now,
        updated_at=now,
    )


@pytest.mark.unit
def test_list_boards_and_list_tasks_mapping() -> None:
    class Repo:
        def list_boards(self) -> list[SimpleNamespace]:
            return [SimpleNamespace(id="board-1", name="Main")]

        def list_tasks(self, _board_id: str) -> list[SimpleNamespace]:
            return [_task()]

    service = BoardService(cast(SqlAlchemyRepository, Repo()))
    boards = service.list_boards()
    tasks = service.list_tasks("board-1")
    assert boards[0]["name"] == "Main"
    assert tasks[0]["status"] == TaskStatus.todo


@pytest.mark.unit
def test_get_board_none_returns_none() -> None:
    class Repo:
        def get_board(self, _board_id: str) -> None:
            return None

    service = BoardService(cast(SqlAlchemyRepository, Repo()))
    assert service.get_board("missing") is None


@pytest.mark.unit
def test_update_task_branches() -> None:
    class Repo:
        def __init__(self) -> None:
            self.task = _task(TaskStatus.todo)

        def get_task(self, task_id: str) -> SimpleNamespace | None:
            return None if task_id == "missing" else self.task

        def update_task(
            self,
            _task_id: str,
            _title: str | None,
            _description: str | None,
            _priority: TaskPriority | None,
            _status: TaskStatus | None,
            _column_id: str | None,
        ) -> SimpleNamespace | None:
            return None

    repo = Repo()
    service = BoardService(cast(SqlAlchemyRepository, repo))

    assert service.update_task("missing", None, None, None, None, None) is None
    with pytest.raises(ValueError):
        service.update_task("exists", None, None, None, TaskStatus.review, None)
    assert service.update_task("exists", "x", None, None, None, None) is None


@pytest.mark.unit
def test_update_task_success_branch() -> None:
    class Repo:
        def __init__(self) -> None:
            self.task = _task(TaskStatus.todo)

        def get_task(self, _task_id: str) -> SimpleNamespace:
            return self.task

        def update_task(
            self,
            _task_id: str,
            _title: str | None,
            _description: str | None,
            _priority: TaskPriority | None,
            status: TaskStatus | None,
            _column_id: str | None,
        ) -> SimpleNamespace:
            if status is not None:
                self.task.status = status.value
            return self.task

    service = BoardService(cast(SqlAlchemyRepository, Repo()))
    updated = service.update_task("exists", None, None, None, TaskStatus.in_progress, None)
    assert updated is not None
    assert updated["status"] == TaskStatus.in_progress


@pytest.mark.unit
def test_move_task_branches() -> None:
    class Repo:
        def __init__(self) -> None:
            self.task = _task(TaskStatus.todo)

        def get_task(self, task_id: str) -> SimpleNamespace | None:
            return None if task_id == "missing" else self.task

        def move_task(
            self,
            _task_id: str,
            _column_id: str,
            _status: TaskStatus,
        ) -> SimpleNamespace | None:
            return None

    service = BoardService(cast(SqlAlchemyRepository, Repo()))
    assert service.move_task("missing", "col-2", TaskStatus.todo) is None
    with pytest.raises(ValueError):
        service.move_task("exists", "col-2", TaskStatus.review)
    assert service.move_task("exists", "col-2", TaskStatus.in_progress) is None
