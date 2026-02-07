from app.domain.dtos import ChatMessageData, ChatRunData, ChatSessionData
from app.domain.types import RunStatus
from app.infra.llm.litellm_client import LiteLlmClient
from app.infra.telemetry.langfuse import LangfuseTracer
from app.repositories.sqlalchemy_repo import SqlAlchemyRepository


class ChatService:
    def __init__(
        self,
        repo: SqlAlchemyRepository,
        llm_client: LiteLlmClient,
        tracer: LangfuseTracer,
    ) -> None:
        self.repo = repo
        self.llm_client = llm_client
        self.tracer = tracer

    def create_session(self, title: str) -> ChatSessionData:
        session = self.repo.create_chat_session(title=title)
        return {
            "id": session.id,
            "title": session.title,
            "createdAt": session.created_at.isoformat(),
        }

    def add_message(self, session_id: str, role: str, content: str) -> ChatMessageData:
        message = self.repo.add_chat_message(session_id=session_id, role=role, content=content)

        run_payload: ChatRunData | None = None
        if role == "user":
            trace = self.tracer.start("chat.completion")
            run = self.repo.create_run(
                session_id=session_id,
                message_id=message.id,
                status=RunStatus.running,
                model=self.llm_client.settings.litellm_model,
                trace_id=trace.trace_id,
            )
            try:
                reply = self.llm_client.generate_reply(
                    [
                        {"role": "user", "content": content},
                    ]
                )
                self.repo.add_chat_message(
                    session_id=session_id, role="assistant", content=reply.content
                )
                self.repo.update_run_status(run.id, RunStatus.succeeded)
                self.tracer.end(trace, "succeeded")
                run_payload = {
                    "id": run.id,
                    "status": RunStatus.succeeded.value,
                    "provider": reply.provider,
                    "model": reply.model,
                    "traceId": trace.trace_id,
                }
            except Exception:
                self.repo.update_run_status(run.id, RunStatus.failed)
                self.tracer.end(trace, "failed")
                raise

        return {
            "id": message.id,
            "sessionId": message.session_id,
            "role": message.role,
            "content": message.content,
            "createdAt": message.created_at.isoformat(),
            "run": run_payload,
        }

    def list_messages(self, session_id: str) -> list[ChatMessageData]:
        return [
            {
                "id": message.id,
                "sessionId": message.session_id,
                "role": message.role,
                "content": message.content,
                "createdAt": message.created_at.isoformat(),
            }
            for message in self.repo.list_chat_messages(session_id)
        ]
