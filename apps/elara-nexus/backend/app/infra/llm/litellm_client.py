from dataclasses import dataclass

import httpx

from app.core.config import Settings


@dataclass(slots=True)
class LlmReply:
    content: str
    provider: str
    model: str


class LiteLlmClient:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def generate_reply(self, messages: list[dict[str, str]]) -> LlmReply:
        if not self.settings.litellm_base_url:
            last = messages[-1]["content"] if messages else ""
            return LlmReply(
                content=f"Echo: {last}", provider="litellm", model=self.settings.litellm_model
            )

        headers = {}
        if self.settings.litellm_api_key:
            headers["Authorization"] = f"Bearer {self.settings.litellm_api_key}"

        response = httpx.post(
            f"{self.settings.litellm_base_url.rstrip('/')}/v1/chat/completions",
            headers=headers,
            json={"model": self.settings.litellm_model, "messages": messages},
            timeout=self.settings.app_request_timeout_seconds,
        )
        response.raise_for_status()
        payload = response.json()
        try:
            content = payload["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as exc:
            raise RuntimeError("Unexpected response from LiteLLM") from exc
        return LlmReply(content=content, provider="litellm", model=self.settings.litellm_model)
