from typing import Protocol

from app.domain.types import TaskPriority, TaskStatus
from app.infra.db.models import Board, BoardColumn, Task, TaskEvent


class BoardRepository(Protocol):
    def create_board(self, name: str) -> Board: ...

    def list_boards(self) -> list[Board]: ...

    def patch_board(self, board_id: str, name: str) -> Board | None: ...

    def get_board(self, board_id: str) -> Board | None: ...

    def get_columns(self, board_id: str) -> list[BoardColumn]: ...


class TaskRepository(Protocol):
    def create_task(
        self,
        board_id: str,
        column_id: str,
        title: str,
        description: str,
        priority: TaskPriority,
        status: TaskStatus,
    ) -> Task: ...

    def list_tasks(self, board_id: str) -> list[Task]: ...

    def get_task(self, task_id: str) -> Task | None: ...

    def update_task(
        self,
        task_id: str,
        title: str | None,
        description: str | None,
        priority: TaskPriority | None,
        status: TaskStatus | None,
        column_id: str | None,
    ) -> Task | None: ...

    def move_task(self, task_id: str, column_id: str, status: TaskStatus) -> Task | None: ...

    def task_history(self, task_id: str) -> list[TaskEvent]: ...


class BoardTaskRepository(BoardRepository, TaskRepository, Protocol):
    """Composition protocol used by service layer orchestration."""
