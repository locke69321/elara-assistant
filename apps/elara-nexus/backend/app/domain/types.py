from enum import StrEnum


class TaskStatus(StrEnum):
    backlog = "backlog"
    todo = "todo"
    in_progress = "in_progress"
    blocked = "blocked"
    review = "review"
    done = "done"


class TaskPriority(StrEnum):
    p0 = "p0"
    p1 = "p1"
    p2 = "p2"
    p3 = "p3"


class RunStatus(StrEnum):
    queued = "queued"
    running = "running"
    succeeded = "succeeded"
    failed = "failed"
    canceled = "canceled"


VALID_TRANSITIONS: dict[TaskStatus, set[TaskStatus]] = {
    TaskStatus.backlog: {TaskStatus.todo, TaskStatus.in_progress, TaskStatus.blocked},
    TaskStatus.todo: {TaskStatus.in_progress, TaskStatus.blocked, TaskStatus.done},
    TaskStatus.in_progress: {TaskStatus.review, TaskStatus.blocked, TaskStatus.todo},
    TaskStatus.blocked: {TaskStatus.todo, TaskStatus.in_progress},
    TaskStatus.review: {TaskStatus.done, TaskStatus.in_progress, TaskStatus.blocked},
    TaskStatus.done: {TaskStatus.todo, TaskStatus.in_progress},
}


def can_transition(current: TaskStatus, target: TaskStatus) -> bool:
    if current == target:
        return True
    return target in VALID_TRANSITIONS[current]
