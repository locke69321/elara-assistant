import pytest
from fastapi.testclient import TestClient


@pytest.mark.integration
def test_board_and_task_flow(client: TestClient, auth_headers: dict[str, str]) -> None:
    create_board = client.post("/api/v1/boards", json={"name": "Core"}, headers=auth_headers)
    assert create_board.status_code == 200
    board = create_board.json()

    board_detail = client.get(f"/api/v1/boards/{board['id']}", headers=auth_headers)
    assert board_detail.status_code == 200
    columns = board_detail.json()["columns"]
    todo_column = next(column for column in columns if column["key"] == "todo")
    in_progress_column = next(column for column in columns if column["key"] == "in_progress")

    create_task = client.post(
        "/api/v1/tasks",
        json={
            "boardId": board["id"],
            "columnId": todo_column["id"],
            "title": "Implement auth",
            "description": "Add bearer auth",
            "priority": "p1",
            "status": "todo",
        },
        headers=auth_headers,
    )
    assert create_task.status_code == 200
    task = create_task.json()

    move_task = client.post(
        f"/api/v1/tasks/{task['id']}/move",
        json={"columnId": in_progress_column["id"], "status": "in_progress"},
        headers=auth_headers,
    )
    assert move_task.status_code == 200

    history = client.get(f"/api/v1/tasks/{task['id']}/history", headers=auth_headers)
    assert history.status_code == 200
    assert len(history.json()) >= 2


@pytest.mark.integration
def test_board_patch_and_task_error_paths(client: TestClient, auth_headers: dict[str, str]) -> None:
    board_resp = client.post("/api/v1/boards", json={"name": "Ops"}, headers=auth_headers)
    assert board_resp.status_code == 200
    board = board_resp.json()

    patched = client.patch(
        f"/api/v1/boards/{board['id']}",
        json={"name": "Operations"},
        headers=auth_headers,
    )
    assert patched.status_code == 200
    assert patched.json()["name"] == "Operations"

    missing_board = client.patch(
        "/api/v1/boards/does-not-exist",
        json={"name": "Nope"},
        headers=auth_headers,
    )
    assert missing_board.status_code == 404

    detail = client.get(f"/api/v1/boards/{board['id']}", headers=auth_headers)
    columns = detail.json()["columns"]
    todo_column = next(column for column in columns if column["key"] == "todo")

    create_task = client.post(
        "/api/v1/tasks",
        json={
            "boardId": board["id"],
            "columnId": todo_column["id"],
            "title": "Cannot skip workflow",
            "description": "invalid transition test",
            "priority": "p2",
            "status": "todo",
        },
        headers=auth_headers,
    )
    assert create_task.status_code == 200
    task = create_task.json()

    invalid_patch = client.patch(
        f"/api/v1/tasks/{task['id']}",
        json={"status": "review"},
        headers=auth_headers,
    )
    assert invalid_patch.status_code == 400

    missing_task = client.patch(
        "/api/v1/tasks/missing-task-id",
        json={"title": "ignored"},
        headers=auth_headers,
    )
    assert missing_task.status_code == 404


@pytest.mark.integration
def test_me_list_and_move_error_routes(client: TestClient, auth_headers: dict[str, str]) -> None:
    me_first = client.get("/api/v1/me", headers=auth_headers)
    me_second = client.get("/api/v1/me", headers=auth_headers)
    assert me_first.status_code == 200
    assert me_second.status_code == 200
    assert me_first.json()["id"] == me_second.json()["id"]

    board_resp = client.post("/api/v1/boards", json={"name": "Planning"}, headers=auth_headers)
    assert board_resp.status_code == 200
    board = board_resp.json()

    boards = client.get("/api/v1/boards", headers=auth_headers)
    assert boards.status_code == 200
    assert any(item["id"] == board["id"] for item in boards.json())

    detail = client.get(f"/api/v1/boards/{board['id']}", headers=auth_headers)
    columns = detail.json()["columns"]
    todo_column = next(column for column in columns if column["key"] == "todo")

    task_resp = client.post(
        "/api/v1/tasks",
        json={
            "boardId": board["id"],
            "columnId": todo_column["id"],
            "title": "Branch checks",
            "description": "router branches",
            "priority": "p2",
            "status": "todo",
        },
        headers=auth_headers,
    )
    assert task_resp.status_code == 200
    task = task_resp.json()

    list_tasks = client.get(f"/api/v1/boards/{board['id']}/tasks", headers=auth_headers)
    assert list_tasks.status_code == 200
    assert any(item["id"] == task["id"] for item in list_tasks.json())

    patch_ok = client.patch(
        f"/api/v1/tasks/{task['id']}",
        json={"status": "in_progress"},
        headers=auth_headers,
    )
    assert patch_ok.status_code == 200

    invalid_move = client.post(
        f"/api/v1/tasks/{task['id']}/move",
        json={"columnId": todo_column["id"], "status": "done"},
        headers=auth_headers,
    )
    assert invalid_move.status_code == 400

    missing_move = client.post(
        "/api/v1/tasks/missing-task-id/move",
        json={"columnId": todo_column["id"], "status": "todo"},
        headers=auth_headers,
    )
    assert missing_move.status_code == 404

    missing_board = client.get("/api/v1/boards/not-found", headers=auth_headers)
    assert missing_board.status_code == 404
