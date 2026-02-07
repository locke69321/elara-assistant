from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.schemas import (
    AgentStatusResponse,
    BoardCreateRequest,
    BoardDetailResponse,
    BoardPatchRequest,
    BoardResponse,
    ChatMessageCreateRequest,
    ChatMessageResponse,
    ChatSessionCreateRequest,
    ChatSessionResponse,
    ColumnResponse,
    HealthResponse,
    MemoryDocumentCreateRequest,
    MemoryDocumentDetailResponse,
    MemoryDocumentResponse,
    MemorySearchRequest,
    MemorySearchResultResponse,
    MeResponse,
    RunResponse,
    TaskCreateRequest,
    TaskHistoryResponse,
    TaskMoveRequest,
    TaskPatchRequest,
    TaskResponse,
)
from app.api.utils import parse_iso
from app.core.config import Settings, get_settings
from app.domain.dtos import TaskResponseData
from app.infra.db.models import User
from app.infra.db.session import get_db_session
from app.infra.llm.litellm_client import LiteLlmClient
from app.infra.telemetry.langfuse import LangfuseTracer
from app.repositories.sqlalchemy_repo import SqlAlchemyRepository
from app.services.agent_service import AgentService
from app.services.board_service import BoardService
from app.services.chat_service import ChatService
from app.services.memory_service import MemoryService

router = APIRouter(prefix="/api/v1", tags=["v1"])


def _task_response(task: TaskResponseData) -> TaskResponse:
    return TaskResponse(
        id=task["id"],
        boardId=task["boardId"],
        columnId=task["columnId"],
        title=task["title"],
        description=task["description"],
        priority=task["priority"],
        status=task["status"],
        createdAt=parse_iso(task["createdAt"]),
        updatedAt=parse_iso(task["updatedAt"]),
    )


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok")


@router.get("/ready", response_model=HealthResponse)
def ready(session: Session = Depends(get_db_session)) -> HealthResponse:
    session.execute(text("SELECT 1"))
    return HealthResponse(status="ready")


@router.get("/me", response_model=MeResponse)
def me(session: Session = Depends(get_db_session)) -> MeResponse:
    user = session.query(User).first()
    if user is None:
        user = User(email="owner@local", name="Owner")
        session.add(user)
        session.commit()
        session.refresh(user)
    return MeResponse(id=user.id, email=user.email, name=user.name)


@router.get("/agent/status", response_model=AgentStatusResponse)
def agent_status(session: Session = Depends(get_db_session)) -> AgentStatusResponse:
    service = AgentService(SqlAlchemyRepository(session))
    status = service.get_status()
    return AgentStatusResponse(
        status=status["status"],
        subagents=status["subagents"],
        activeRuns=status["activeRuns"],
        lastRunAt=parse_iso(status["lastRunAt"]) if status["lastRunAt"] is not None else None,
    )


@router.get("/boards", response_model=list[BoardResponse])
def list_boards(session: Session = Depends(get_db_session)) -> list[BoardResponse]:
    service = BoardService(SqlAlchemyRepository(session))
    return [BoardResponse(**board) for board in service.list_boards()]


@router.post("/boards", response_model=BoardResponse)
def create_board(
    payload: BoardCreateRequest, session: Session = Depends(get_db_session)
) -> BoardResponse:
    service = BoardService(SqlAlchemyRepository(session))
    board = service.create_board(payload.name)
    return BoardResponse(**board)


@router.get("/boards/{board_id}", response_model=BoardDetailResponse)
def get_board(board_id: str, session: Session = Depends(get_db_session)) -> BoardDetailResponse:
    service = BoardService(SqlAlchemyRepository(session))
    board = service.get_board(board_id)
    if board is None:
        raise HTTPException(status_code=404, detail="Board not found")
    return BoardDetailResponse(
        id=board["id"],
        name=board["name"],
        columns=[ColumnResponse(**column) for column in board["columns"]],
    )


@router.patch("/boards/{board_id}", response_model=BoardResponse)
def patch_board(
    board_id: str,
    payload: BoardPatchRequest,
    session: Session = Depends(get_db_session),
) -> BoardResponse:
    service = BoardService(SqlAlchemyRepository(session))
    board = service.patch_board(board_id, payload.name)
    if board is None:
        raise HTTPException(status_code=404, detail="Board not found")
    return BoardResponse(**board)


@router.get("/boards/{board_id}/tasks", response_model=list[TaskResponse])
def list_tasks(board_id: str, session: Session = Depends(get_db_session)) -> list[TaskResponse]:
    service = BoardService(SqlAlchemyRepository(session))
    tasks = service.list_tasks(board_id)
    return [_task_response(task) for task in tasks]


@router.post("/tasks", response_model=TaskResponse)
def create_task(
    payload: TaskCreateRequest, session: Session = Depends(get_db_session)
) -> TaskResponse:
    service = BoardService(SqlAlchemyRepository(session))
    task = service.create_task(
        board_id=payload.boardId,
        column_id=payload.columnId,
        title=payload.title,
        description=payload.description,
        priority=payload.priority,
        status=payload.status,
    )
    return _task_response(task)


@router.patch("/tasks/{task_id}", response_model=TaskResponse)
def patch_task(
    task_id: str,
    payload: TaskPatchRequest,
    session: Session = Depends(get_db_session),
) -> TaskResponse:
    service = BoardService(SqlAlchemyRepository(session))
    try:
        task = service.update_task(
            task_id=task_id,
            title=payload.title,
            description=payload.description,
            priority=payload.priority,
            status=payload.status,
            column_id=payload.columnId,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return _task_response(task)


@router.post("/tasks/{task_id}/move", response_model=TaskResponse)
def move_task(
    task_id: str,
    payload: TaskMoveRequest,
    session: Session = Depends(get_db_session),
) -> TaskResponse:
    service = BoardService(SqlAlchemyRepository(session))
    try:
        task = service.move_task(task_id=task_id, column_id=payload.columnId, status=payload.status)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return _task_response(task)


@router.get("/tasks/{task_id}/history", response_model=list[TaskHistoryResponse])
def task_history(
    task_id: str, session: Session = Depends(get_db_session)
) -> list[TaskHistoryResponse]:
    service = BoardService(SqlAlchemyRepository(session))
    history = service.task_history(task_id)
    return [
        TaskHistoryResponse(
            id=event["id"],
            eventType=event["eventType"],
            payload=event["payload"],
            createdAt=parse_iso(event["createdAt"]),
        )
        for event in history
    ]


@router.post("/chat/sessions", response_model=ChatSessionResponse)
def create_chat_session(
    payload: ChatSessionCreateRequest,
    session: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> ChatSessionResponse:
    repo = SqlAlchemyRepository(session)
    service = ChatService(repo, LiteLlmClient(settings), LangfuseTracer(settings))
    item = service.create_session(payload.title)
    return ChatSessionResponse(
        id=item["id"], title=item["title"], createdAt=parse_iso(item["createdAt"])
    )


@router.get("/chat/sessions", response_model=list[ChatSessionResponse])
def list_chat_sessions(
    session: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> list[ChatSessionResponse]:
    repo = SqlAlchemyRepository(session)
    service = ChatService(repo, LiteLlmClient(settings), LangfuseTracer(settings))
    sessions = service.list_sessions()
    return [
        ChatSessionResponse(
            id=item["id"],
            title=item["title"],
            createdAt=parse_iso(item["createdAt"]),
        )
        for item in sessions
    ]


@router.post("/chat/sessions/{session_id}/messages", response_model=ChatMessageResponse)
def add_chat_message(
    session_id: str,
    payload: ChatMessageCreateRequest,
    session: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> ChatMessageResponse:
    repo = SqlAlchemyRepository(session)
    service = ChatService(repo, LiteLlmClient(settings), LangfuseTracer(settings))
    try:
        item = service.add_message(
            session_id=session_id,
            role=payload.role,
            content=payload.content,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    run = item.get("run")
    return ChatMessageResponse(
        id=item["id"],
        sessionId=item["sessionId"],
        role=item["role"],
        content=item["content"],
        createdAt=parse_iso(item["createdAt"]),
        run=RunResponse(**run) if run is not None else None,
    )


@router.get("/chat/sessions/{session_id}/messages", response_model=list[ChatMessageResponse])
def list_chat_messages(
    session_id: str,
    session: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> list[ChatMessageResponse]:
    repo = SqlAlchemyRepository(session)
    service = ChatService(repo, LiteLlmClient(settings), LangfuseTracer(settings))
    try:
        messages = service.list_messages(session_id=session_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return [
        ChatMessageResponse(
            id=item["id"],
            sessionId=item["sessionId"],
            role=item["role"],
            content=item["content"],
            createdAt=parse_iso(item["createdAt"]),
            run=None,
        )
        for item in messages
    ]


@router.post("/memory/documents", response_model=MemoryDocumentResponse)
def create_memory_document(
    payload: MemoryDocumentCreateRequest,
    session: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> MemoryDocumentResponse:
    service = MemoryService(
        SqlAlchemyRepository(session), vector_dimensions=settings.app_vector_dimensions
    )
    item = service.ingest_document(payload.title, payload.content, payload.sourceRef)
    return MemoryDocumentResponse(**item)


@router.post("/memory/search", response_model=list[MemorySearchResultResponse])
def search_memory(
    payload: MemorySearchRequest,
    session: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> list[MemorySearchResultResponse]:
    service = MemoryService(
        SqlAlchemyRepository(session), vector_dimensions=settings.app_vector_dimensions
    )
    items = service.search(payload.query, limit=payload.limit)
    return [MemorySearchResultResponse(**item) for item in items]


@router.get("/memory/documents/{document_id}", response_model=MemoryDocumentDetailResponse)
def get_memory_document(
    document_id: str,
    session: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> MemoryDocumentDetailResponse:
    service = MemoryService(
        SqlAlchemyRepository(session), vector_dimensions=settings.app_vector_dimensions
    )
    item = service.get_document(document_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Document not found")
    return MemoryDocumentDetailResponse(
        id=item["id"],
        title=item["title"],
        content=item["content"],
        sourceRef=item["sourceRef"],
        createdAt=parse_iso(item["createdAt"]),
    )
