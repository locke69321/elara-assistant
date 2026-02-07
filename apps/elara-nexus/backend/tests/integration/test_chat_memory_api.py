import pytest
from fastapi.testclient import TestClient

from app.infra.llm.litellm_client import LlmReply


@pytest.mark.integration
def test_chat_flow(client: TestClient, auth_headers: dict[str, str]) -> None:
    list_empty = client.get("/api/v1/chat/sessions", headers=auth_headers)
    assert list_empty.status_code == 200
    assert list_empty.json() == []

    create = client.post("/api/v1/chat/sessions", json={"title": "Plan"}, headers=auth_headers)
    assert create.status_code == 200
    session = create.json()

    list_sessions = client.get("/api/v1/chat/sessions", headers=auth_headers)
    assert list_sessions.status_code == 200
    assert len(list_sessions.json()) == 1
    assert list_sessions.json()[0]["id"] == session["id"]

    send = client.post(
        f"/api/v1/chat/sessions/{session['id']}/messages",
        json={"role": "user", "content": "Hello"},
        headers=auth_headers,
    )
    assert send.status_code == 200
    assert send.json()["run"] is not None

    list_messages = client.get(
        f"/api/v1/chat/sessions/{session['id']}/messages", headers=auth_headers
    )
    assert list_messages.status_code == 200
    assert len(list_messages.json()) >= 2


@pytest.mark.integration
def test_memory_flow(client: TestClient, auth_headers: dict[str, str]) -> None:
    ingest = client.post(
        "/api/v1/memory/documents",
        json={
            "title": "Spec",
            "content": "agent platform with strict testing",
            "sourceRef": "spec",
        },
        headers=auth_headers,
    )
    assert ingest.status_code == 200
    doc = ingest.json()

    search = client.post(
        "/api/v1/memory/search",
        json={"query": "strict testing", "limit": 3},
        headers=auth_headers,
    )
    assert search.status_code == 200
    results = search.json()
    assert len(results) >= 1
    assert results[0]["documentId"] == doc["id"]

    get_doc = client.get(f"/api/v1/memory/documents/{doc['id']}", headers=auth_headers)
    assert get_doc.status_code == 200


@pytest.mark.integration
def test_chat_assistant_message_and_missing_memory_doc(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    create = client.post("/api/v1/chat/sessions", json={"title": "NoRun"}, headers=auth_headers)
    assert create.status_code == 200
    session = create.json()

    send = client.post(
        f"/api/v1/chat/sessions/{session['id']}/messages",
        json={"role": "assistant", "content": "pre-seeded"},
        headers=auth_headers,
    )
    assert send.status_code == 200
    assert send.json()["run"] is None

    missing = client.get("/api/v1/memory/documents/not-real", headers=auth_headers)
    assert missing.status_code == 404


@pytest.mark.integration
def test_chat_missing_session_returns_not_found(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    missing_send = client.post(
        "/api/v1/chat/sessions/missing/messages",
        json={"role": "user", "content": "Hello"},
        headers=auth_headers,
    )
    assert missing_send.status_code == 404
    assert missing_send.json()["detail"] == "Session not found"

    missing_list = client.get("/api/v1/chat/sessions/missing/messages", headers=auth_headers)
    assert missing_list.status_code == 404
    assert missing_list.json()["detail"] == "Session not found"


@pytest.mark.integration
def test_chat_completion_uses_conversation_history(
    client: TestClient,
    auth_headers: dict[str, str],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    captured_payloads: list[list[dict[str, str]]] = []

    def _fake_generate_reply(
        _self: object, messages: list[dict[str, str]]
    ) -> LlmReply:
        captured_payloads.append(messages)
        return LlmReply(content="stub-response", provider="litellm", model="test-model")

    monkeypatch.setattr(
        "app.infra.llm.litellm_client.LiteLlmClient.generate_reply",
        _fake_generate_reply,
    )

    create = client.post("/api/v1/chat/sessions", json={"title": "Context"}, headers=auth_headers)
    assert create.status_code == 200
    session = create.json()

    first_send = client.post(
        f"/api/v1/chat/sessions/{session['id']}/messages",
        json={"role": "user", "content": "first prompt"},
        headers=auth_headers,
    )
    assert first_send.status_code == 200

    second_send = client.post(
        f"/api/v1/chat/sessions/{session['id']}/messages",
        json={"role": "user", "content": "second prompt"},
        headers=auth_headers,
    )
    assert second_send.status_code == 200

    assert len(captured_payloads) == 2
    assert captured_payloads[0] == [{"role": "user", "content": "first prompt"}]
    assert captured_payloads[1] == [
        {"role": "user", "content": "first prompt"},
        {"role": "assistant", "content": "stub-response"},
        {"role": "user", "content": "second prompt"},
    ]


@pytest.mark.integration
def test_agent_status_is_idle_when_no_runs(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    response = client.get("/api/v1/agent/status", headers=auth_headers)
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "idle"
    assert payload["subagents"] == []
    assert payload["activeRuns"] == 0
    assert payload["lastRunAt"] is None


@pytest.mark.integration
def test_agent_status_reports_active_when_run_is_still_running(
    client: TestClient,
    auth_headers: dict[str, str],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def _skip_run_completion(_self: object, _run_id: str, _status: object) -> None:
        return None

    monkeypatch.setattr(
        "app.repositories.sqlalchemy_repo.SqlAlchemyRepository.update_run_status",
        _skip_run_completion,
    )

    create = client.post("/api/v1/chat/sessions", json={"title": "Runtime"}, headers=auth_headers)
    assert create.status_code == 200
    session = create.json()

    send = client.post(
        f"/api/v1/chat/sessions/{session['id']}/messages",
        json={"role": "user", "content": "start run"},
        headers=auth_headers,
    )
    assert send.status_code == 200

    status = client.get("/api/v1/agent/status", headers=auth_headers)
    assert status.status_code == 200
    payload = status.json()
    assert payload["status"] == "active"
    assert payload["activeRuns"] == 1
    assert payload["subagents"] == ["chat:gpt-4o-mini"]
    assert payload["lastRunAt"] is not None
