from datetime import datetime

from pydantic import BaseModel, Field

from app.domain.types import TaskPriority, TaskStatus


class HealthResponse(BaseModel):
    status: str


class MeResponse(BaseModel):
    id: str
    email: str
    name: str


class BoardCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class BoardPatchRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class ColumnResponse(BaseModel):
    id: str
    key: str
    name: str
    position: int


class BoardResponse(BaseModel):
    id: str
    name: str


class BoardDetailResponse(BoardResponse):
    columns: list[ColumnResponse]


class TaskCreateRequest(BaseModel):
    boardId: str
    columnId: str
    title: str = Field(min_length=1, max_length=255)
    description: str = ""
    priority: TaskPriority = TaskPriority.p2
    status: TaskStatus = TaskStatus.backlog


class TaskPatchRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    priority: TaskPriority | None = None
    status: TaskStatus | None = None
    columnId: str | None = None


class TaskMoveRequest(BaseModel):
    columnId: str
    status: TaskStatus


class TaskResponse(BaseModel):
    id: str
    boardId: str
    columnId: str
    title: str
    description: str
    priority: TaskPriority
    status: TaskStatus
    createdAt: datetime
    updatedAt: datetime


class TaskHistoryResponse(BaseModel):
    id: str
    eventType: str
    payload: str
    createdAt: datetime


class ChatSessionCreateRequest(BaseModel):
    title: str = Field(default="New Chat", min_length=1, max_length=255)


class ChatSessionResponse(BaseModel):
    id: str
    title: str
    createdAt: datetime


class ChatMessageCreateRequest(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    content: str = Field(min_length=1)


class RunResponse(BaseModel):
    id: str
    status: str
    provider: str
    model: str
    traceId: str


class ChatMessageResponse(BaseModel):
    id: str
    sessionId: str
    role: str
    content: str
    createdAt: datetime
    run: RunResponse | None = None


class MemoryDocumentCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    content: str = Field(min_length=1)
    sourceRef: str = ""


class MemoryDocumentResponse(BaseModel):
    id: str
    title: str
    chunkCount: int


class MemorySearchRequest(BaseModel):
    query: str = Field(min_length=1)
    limit: int = Field(default=5, ge=1, le=20)


class MemorySearchResultResponse(BaseModel):
    chunkId: str
    documentId: str
    score: float
    snippet: str
    sourceRef: str


class MemoryDocumentDetailResponse(BaseModel):
    id: str
    title: str
    content: str
    sourceRef: str
    createdAt: datetime
