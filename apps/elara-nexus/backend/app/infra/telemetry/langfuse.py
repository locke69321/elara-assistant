import logging
from dataclasses import dataclass
from uuid import uuid4

from app.core.config import Settings

logger = logging.getLogger(__name__)


@dataclass(slots=True)
class TraceContext:
    trace_id: str


class LangfuseTracer:
    def __init__(self, settings: Settings) -> None:
        self.enabled = bool(
            settings.langfuse_host and settings.langfuse_public_key and settings.langfuse_secret_key
        )

    def start(self, operation: str) -> TraceContext:
        trace_id = str(uuid4())
        if not self.enabled:
            return TraceContext(trace_id=trace_id)
        logger.info("trace_start", extra={"audit": {"trace_id": trace_id, "op": operation}})
        return TraceContext(trace_id=trace_id)

    def end(self, trace: TraceContext, status: str) -> None:
        if not self.enabled:
            return
        logger.info("trace_end", extra={"audit": {"trace_id": trace.trace_id, "status": status}})
