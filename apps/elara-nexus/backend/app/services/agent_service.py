from app.domain.dtos import AgentStatusData
from app.domain.types import RunStatus
from app.repositories.sqlalchemy_repo import SqlAlchemyRepository


class AgentService:
    def __init__(self, repo: SqlAlchemyRepository) -> None:
        self.repo = repo

    def get_status(self) -> AgentStatusData:
        running_runs = self.repo.list_runs_by_status(RunStatus.running)
        latest_run = self.repo.latest_run()
        subagents = sorted(
            {
                f"chat:{run.model}" if run.model else "chat:unknown-model"
                for run in running_runs
            }
        )

        return {
            "status": "active" if running_runs else "idle",
            "subagents": subagents,
            "activeRuns": len(running_runs),
            "lastRunAt": latest_run.created_at.isoformat() if latest_run is not None else None,
        }
