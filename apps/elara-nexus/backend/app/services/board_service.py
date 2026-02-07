from app.domain.dtos import (
    BoardDetailData,
    BoardResponseData,
    TaskHistoryData,
    TaskResponseData,
)
from app.domain.types import TaskPriority, TaskStatus, can_transition
from app.infra.db.models import Task
from app.repositories.interfaces import BoardTaskRepository


class BoardService:
    def __init__(self, repo: BoardTaskRepository) -> None:
        self.repo = repo

    def create_board(self, name: str) -> BoardResponseData:
        board = self.repo.create_board(name)
        return {"id": board.id, "name": board.name}

    def list_boards(self) -> list[BoardResponseData]:
        boards = self.repo.list_boards()
        return [{"id": b.id, "name": b.name} for b in boards]

    def patch_board(self, board_id: str, name: str) -> BoardResponseData | None:
        board = self.repo.patch_board(board_id, name)
        if board is None:
            return None
        return {"id": board.id, "name": board.name}

    def get_board(self, board_id: str) -> BoardDetailData | None:
        board = self.repo.get_board(board_id)
        if board is None:
            return None
        columns = self.repo.get_columns(board_id)
        return {
            "id": board.id,
            "name": board.name,
            "columns": [
                {
                    "id": column.id,
                    "key": column.key,
                    "name": column.name,
                    "position": column.position,
                }
                for column in columns
            ],
        }

    def create_task(
        self,
        board_id: str,
        column_id: str,
        title: str,
        description: str,
        priority: TaskPriority,
        status: TaskStatus,
    ) -> TaskResponseData:
        task = self.repo.create_task(board_id, column_id, title, description, priority, status)
        return self._task_to_dict(task)

    def list_tasks(self, board_id: str) -> list[TaskResponseData]:
        return [self._task_to_dict(task) for task in self.repo.list_tasks(board_id)]

    def update_task(
        self,
        task_id: str,
        title: str | None,
        description: str | None,
        priority: TaskPriority | None,
        status: TaskStatus | None,
        column_id: str | None,
    ) -> TaskResponseData | None:
        task = self.repo.get_task(task_id)
        if task is None:
            return None

        current_status = TaskStatus(task.status)
        if status is not None and not can_transition(current_status, status):
            raise ValueError(f"Invalid transition from {current_status.value} to {status.value}")

        updated = self.repo.update_task(task_id, title, description, priority, status, column_id)
        if updated is None:
            return None
        return self._task_to_dict(updated)

    def move_task(
        self, task_id: str, column_id: str, status: TaskStatus
    ) -> TaskResponseData | None:
        task = self.repo.get_task(task_id)
        if task is None:
            return None

        current_status = TaskStatus(task.status)
        if not can_transition(current_status, status):
            raise ValueError(f"Invalid transition from {current_status.value} to {status.value}")

        moved = self.repo.move_task(task_id, column_id, status)
        if moved is None:
            return None
        return self._task_to_dict(moved)

    def task_history(self, task_id: str) -> list[TaskHistoryData]:
        return [
            {
                "id": event.id,
                "eventType": event.event_type,
                "payload": event.payload,
                "createdAt": event.created_at.isoformat(),
            }
            for event in self.repo.task_history(task_id)
        ]

    def _task_to_dict(self, task: Task) -> TaskResponseData:
        return {
            "id": task.id,
            "boardId": task.board_id,
            "columnId": task.column_id,
            "title": task.title,
            "description": task.description,
            "priority": TaskPriority(task.priority),
            "status": TaskStatus(task.status),
            "createdAt": task.created_at.isoformat(),
            "updatedAt": task.updated_at.isoformat(),
        }
