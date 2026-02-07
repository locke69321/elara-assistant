from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

from app.domain.types import RunStatus, TaskPriority, TaskStatus
from app.infra.db.types import EmbeddingType


class Base(DeclarativeBase):
    pass


def new_id() -> str:
    return str(uuid4())


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=new_id)
    email: Mapped[str] = mapped_column(String(255), unique=True)
    name: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )


class Board(Base):
    __tablename__ = "boards"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=new_id)
    name: Mapped[str] = mapped_column(String(255), unique=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    columns: Mapped[list[BoardColumn]] = relationship(back_populates="board", cascade="all, delete")
    tasks: Mapped[list[Task]] = relationship(back_populates="board", cascade="all, delete")


class BoardColumn(Base):
    __tablename__ = "columns"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=new_id)
    board_id: Mapped[str] = mapped_column(ForeignKey("boards.id", ondelete="CASCADE"), index=True)
    key: Mapped[str] = mapped_column(String(32), index=True)
    name: Mapped[str] = mapped_column(String(255))
    position: Mapped[int] = mapped_column(Integer)

    board: Mapped[Board] = relationship(back_populates="columns")


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=new_id)
    board_id: Mapped[str] = mapped_column(ForeignKey("boards.id", ondelete="CASCADE"), index=True)
    column_id: Mapped[str] = mapped_column(ForeignKey("columns.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    priority: Mapped[str] = mapped_column(String(8), default=TaskPriority.p2.value)
    status: Mapped[str] = mapped_column(String(32), default=TaskStatus.backlog.value)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    board: Mapped[Board] = relationship(back_populates="tasks")
    events: Mapped[list[TaskEvent]] = relationship(back_populates="task", cascade="all, delete")


class TaskEvent(Base):
    __tablename__ = "task_events"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=new_id)
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id", ondelete="CASCADE"), index=True)
    event_type: Mapped[str] = mapped_column(String(64))
    payload: Mapped[str] = mapped_column(Text, default="{}")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )

    task: Mapped[Task] = relationship(back_populates="events")


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=new_id)
    title: Mapped[str] = mapped_column(String(255), default="New Chat")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=new_id)
    session_id: Mapped[str] = mapped_column(
        ForeignKey("chat_sessions.id", ondelete="CASCADE"), index=True
    )
    role: Mapped[str] = mapped_column(String(16))
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )


class Run(Base):
    __tablename__ = "runs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=new_id)
    session_id: Mapped[str] = mapped_column(
        ForeignKey("chat_sessions.id", ondelete="CASCADE"), index=True
    )
    message_id: Mapped[str] = mapped_column(
        ForeignKey("chat_messages.id", ondelete="CASCADE"), index=True
    )
    status: Mapped[str] = mapped_column(String(16), default=RunStatus.queued.value)
    provider: Mapped[str] = mapped_column(String(64), default="litellm")
    model: Mapped[str] = mapped_column(String(128), default="")
    trace_id: Mapped[str] = mapped_column(String(128), default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )


class MemoryDocument(Base):
    __tablename__ = "memory_documents"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=new_id)
    title: Mapped[str] = mapped_column(String(255))
    content: Mapped[str] = mapped_column(Text)
    source_ref: Mapped[str] = mapped_column(String(255), default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )


class MemoryChunk(Base):
    __tablename__ = "memory_chunks"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=new_id)
    document_id: Mapped[str] = mapped_column(
        ForeignKey("memory_documents.id", ondelete="CASCADE"), index=True
    )
    content: Mapped[str] = mapped_column(Text)
    chunk_index: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )


class EmbeddingEntry(Base):
    __tablename__ = "embedding_entries"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=new_id)
    chunk_id: Mapped[str] = mapped_column(
        ForeignKey("memory_chunks.id", ondelete="CASCADE"), index=True
    )
    embedding: Mapped[list[float]] = mapped_column(EmbeddingType(dimensions=8))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
