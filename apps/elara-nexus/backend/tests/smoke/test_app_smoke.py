import pytest
from fastapi.testclient import TestClient


@pytest.mark.smoke
def test_health_and_ready(client: TestClient) -> None:
    health = client.get("/api/v1/health")
    ready = client.get("/api/v1/ready")
    assert health.status_code == 200
    assert ready.status_code == 200


@pytest.mark.smoke
def test_auth_required(client: TestClient) -> None:
    unauthorized = client.get("/api/v1/me")
    assert unauthorized.status_code == 401
