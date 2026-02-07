import pytest
from fastapi.testclient import TestClient


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
