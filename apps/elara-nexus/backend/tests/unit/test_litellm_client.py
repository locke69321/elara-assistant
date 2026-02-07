from __future__ import annotations

import pytest

from app.core.config import Settings
from app.infra.llm.litellm_client import LiteLlmClient


class _MockResponse:
    def raise_for_status(self) -> None:
        return None

    def json(self) -> dict[str, list[dict[str, dict[str, str]]]]:
        return {"choices": [{"message": {"content": "remote reply"}}]}


@pytest.mark.unit
def test_litellm_client_echo_mode() -> None:
    client = LiteLlmClient(Settings(litellm_base_url=None, litellm_model="test-model"))
    reply = client.generate_reply([{"role": "user", "content": "hi"}])
    assert reply.content == "Echo: hi"
    assert reply.model == "test-model"


@pytest.mark.unit
def test_litellm_client_http_mode(monkeypatch: pytest.MonkeyPatch) -> None:
    captured: dict[str, str | dict[str, str] | dict[str, object]] = {}

    def _fake_post(
        url: str,
        headers: dict[str, str],
        json: dict[str, object],
        timeout: float,
    ) -> _MockResponse:
        captured["url"] = url
        captured["headers"] = headers
        captured["json"] = json
        captured["timeout"] = str(timeout)
        return _MockResponse()

    monkeypatch.setattr("app.infra.llm.litellm_client.httpx.post", _fake_post)
    client = LiteLlmClient(
        Settings(
            litellm_base_url="https://litellm.local",
            litellm_api_key="secret",
            litellm_model="gpt-test",
        )
    )

    reply = client.generate_reply([{"role": "user", "content": "hello"}])
    assert reply.content == "remote reply"
    assert reply.model == "gpt-test"
    assert captured["url"] == "https://litellm.local/v1/chat/completions"
