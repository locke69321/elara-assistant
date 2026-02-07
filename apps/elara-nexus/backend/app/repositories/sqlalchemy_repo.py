from __future__ import annotations

import json
from math import sqrt

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain.types import RunStatus, TaskPriority, TaskStatus
from app.infra.db.models import (
    Board,
    BoardColumn,
    ChatMessage,
    ChatSession,
    EmbeddingEntry,
    MemoryChunk,
    MemoryDocument,
    Run,
    Task,
    TaskEvent,
)

DEFAULT_COLUMNS: list[tuple[str, str]] = [
    ("backlog", "Backlog"),
    ("todo", "Todo"),
    ("in_progress", "In Progress"),
    ("blocked", "Blocked"),
    ("review", "Review"),
    ("done", "Done"),
]


class SqlAlchemyRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def ensure_default_board(self) -> Board:
        board = self.session.scalar(select(Board).order_by(Board.created_at.asc()))
        if board is not None:
            return board
        return self.create_board("Default")

    def create_board(self, name: str) -> Board:
        board = Board(name=name)
        self.session.add(board)
        self.session.flush()
        for idx, (key, label) in enumerate(DEFAULT_COLUMNS):
            self.session.add(BoardColumn(board_id=board.id, key=key, name=label, position=idx))
        self.session.commit()
        self.session.refresh(board)
        return board

    def list_boards(self) -> list[Board]:
        return list(self.session.scalars(select(Board).order_by(Board.created_at.asc())).all())

    def patch_board(self, board_id: str, name: str) -> Board | None:
        board = self.session.get(Board, board_id)
        if board is None:
            return None
        board.name = name
        self.session.commit()
        self.session.refresh(board)
        return board

    def get_board(self, board_id: str) -> Board | None:
        return self.session.get(Board, board_id)

    def get_columns(self, board_id: str) -> list[BoardColumn]:
        stmt = (
            select(BoardColumn)
            .where(BoardColumn.board_id == board_id)
            .order_by(BoardColumn.position.asc())
        )
        return list(self.session.scalars(stmt).all())

    def get_column(self, column_id: str) -> BoardColumn | None:
        return self.session.get(BoardColumn, column_id)

    def create_task(
        self,
        board_id: str,
        column_id: str,
        title: str,
        description: str,
        priority: TaskPriority,
        status: TaskStatus,
    ) -> Task:
        task = Task(
            board_id=board_id,
            column_id=column_id,
            title=title,
            description=description,
            priority=priority.value,
            status=status.value,
        )
        self.session.add(task)
        self.session.flush()
        self.session.add(
            TaskEvent(task_id=task.id, event_type="created", payload=json.dumps({"title": title}))
        )
        self.session.commit()
        self.session.refresh(task)
        return task

    def list_tasks(self, board_id: str) -> list[Task]:
        stmt = select(Task).where(Task.board_id == board_id).order_by(Task.created_at.asc())
        return list(self.session.scalars(stmt).all())

    def get_task(self, task_id: str) -> Task | None:
        return self.session.get(Task, task_id)

    def update_task(
        self,
        task_id: str,
        title: str | None,
        description: str | None,
        priority: TaskPriority | None,
        status: TaskStatus | None,
        column_id: str | None,
    ) -> Task | None:
        task = self.session.get(Task, task_id)
        if task is None:
            return None
        if title is not None:
            task.title = title
        if description is not None:
            task.description = description
        if priority is not None:
            task.priority = priority.value
        if status is not None:
            task.status = status.value
        if column_id is not None:
            task.column_id = column_id
        self.session.add(
            TaskEvent(
                task_id=task.id, event_type="updated", payload=json.dumps({"task_id": task.id})
            )
        )
        self.session.commit()
        self.session.refresh(task)
        return task

    def move_task(self, task_id: str, column_id: str, status: TaskStatus) -> Task | None:
        task = self.session.get(Task, task_id)
        if task is None:
            return None
        task.column_id = column_id
        task.status = status.value
        self.session.add(
            TaskEvent(
                task_id=task.id,
                event_type="moved",
                payload=json.dumps({"column_id": column_id, "status": status.value}),
            )
        )
        self.session.commit()
        self.session.refresh(task)
        return task

    def task_history(self, task_id: str) -> list[TaskEvent]:
        stmt = (
            select(TaskEvent)
            .where(TaskEvent.task_id == task_id)
            .order_by(TaskEvent.created_at.asc())
        )
        return list(self.session.scalars(stmt).all())

    def create_chat_session(self, title: str) -> ChatSession:
        session = ChatSession(title=title)
        self.session.add(session)
        self.session.commit()
        self.session.refresh(session)
        return session

    def get_chat_session(self, session_id: str) -> ChatSession | None:
        return self.session.get(ChatSession, session_id)

    def list_chat_sessions(self) -> list[ChatSession]:
        stmt = select(ChatSession).order_by(ChatSession.created_at.desc())
        return list(self.session.scalars(stmt).all())

    def add_chat_message(self, session_id: str, role: str, content: str) -> ChatMessage:
        message = ChatMessage(session_id=session_id, role=role, content=content)
        self.session.add(message)
        self.session.commit()
        self.session.refresh(message)
        return message

    def list_chat_messages(self, session_id: str) -> list[ChatMessage]:
        stmt = (
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.asc())
        )
        return list(self.session.scalars(stmt).all())

    def create_run(
        self, session_id: str, message_id: str, status: RunStatus, model: str, trace_id: str
    ) -> Run:
        run = Run(
            session_id=session_id,
            message_id=message_id,
            status=status.value,
            provider="litellm",
            model=model,
            trace_id=trace_id,
        )
        self.session.add(run)
        self.session.commit()
        self.session.refresh(run)
        return run

    def update_run_status(self, run_id: str, status: RunStatus) -> Run | None:
        run = self.session.get(Run, run_id)
        if run is None:
            return None
        run.status = status.value
        self.session.commit()
        self.session.refresh(run)
        return run

    def create_memory_document(self, title: str, content: str, source_ref: str) -> MemoryDocument:
        doc = MemoryDocument(title=title, content=content, source_ref=source_ref)
        self.session.add(doc)
        self.session.commit()
        self.session.refresh(doc)
        return doc

    def add_memory_chunk(
        self, document_id: str, content: str, chunk_index: int, embedding: list[float]
    ) -> MemoryChunk:
        chunk = MemoryChunk(document_id=document_id, content=content, chunk_index=chunk_index)
        self.session.add(chunk)
        self.session.flush()
        self.session.add(EmbeddingEntry(chunk_id=chunk.id, embedding=embedding))
        self.session.commit()
        self.session.refresh(chunk)
        return chunk

    def list_memory_embeddings(self) -> list[tuple[EmbeddingEntry, MemoryChunk, MemoryDocument]]:
        stmt = (
            select(EmbeddingEntry, MemoryChunk, MemoryDocument)
            .join(MemoryChunk, EmbeddingEntry.chunk_id == MemoryChunk.id)
            .join(MemoryDocument, MemoryChunk.document_id == MemoryDocument.id)
        )
        rows = self.session.execute(stmt).all()
        return [(entry, chunk, document) for entry, chunk, document in rows]

    def get_memory_document(self, document_id: str) -> MemoryDocument | None:
        return self.session.get(MemoryDocument, document_id)


def cosine_similarity(a: list[float], b: list[float]) -> float:
    if not a or not b:
        return 0.0
    dot = sum(x * y for x, y in zip(a, b, strict=False))
    norm_a = sqrt(sum(x * x for x in a))
    norm_b = sqrt(sum(y * y for y in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)
