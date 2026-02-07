from typing import NotRequired, TypedDict

from app.domain.types import TaskPriority, TaskStatus


class BoardResponseData(TypedDict):
    id: str
    name: str


class BoardColumnData(TypedDict):
    id: str
    key: str
    name: str
    position: int


class BoardDetailData(TypedDict):
    id: str
    name: str
    columns: list[BoardColumnData]


class TaskResponseData(TypedDict):
    id: str
    boardId: str
    columnId: str
    title: str
    description: str
    priority: TaskPriority
    status: TaskStatus
    createdAt: str
    updatedAt: str


class TaskHistoryData(TypedDict):
    id: str
    eventType: str
    payload: str
    createdAt: str


class ChatRunData(TypedDict):
    id: str
    status: str
    provider: str
    model: str
    traceId: str


class ChatSessionData(TypedDict):
    id: str
    title: str
    createdAt: str


class ChatMessageData(TypedDict):
    id: str
    sessionId: str
    role: str
    content: str
    createdAt: str
    run: NotRequired[ChatRunData | None]


class AgentStatusData(TypedDict):
    status: str
    subagents: list[str]
    activeRuns: int
    lastRunAt: str | None


class MemoryDocumentData(TypedDict):
    id: str
    title: str
    content: str
    sourceRef: str
    createdAt: str


class MemoryIngestData(TypedDict):
    id: str
    title: str
    chunkCount: int


class MemorySearchResultData(TypedDict):
    chunkId: str
    documentId: str
    score: float
    snippet: str
    sourceRef: str
