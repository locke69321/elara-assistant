import pytest

from app.domain.types import TaskStatus, can_transition


@pytest.mark.unit
def test_valid_transition() -> None:
    assert can_transition(TaskStatus.todo, TaskStatus.in_progress)


@pytest.mark.unit
def test_invalid_transition() -> None:
    assert not can_transition(TaskStatus.backlog, TaskStatus.done)
