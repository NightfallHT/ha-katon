"""Single swappable LLM + embedding client (OpenAI-compatible HTTP).

Default embedding model is text-embedding-3-small, 1536 dimensions, matching
`innovations.embedding vector(1536)` in AGENTS.md. Change EMBEDDING_MODEL and
EMBEDDING_DIM only together with Ola's schema.
"""

from __future__ import annotations

import json
import logging
import os
import re

import httpx

log = logging.getLogger("ai.llm")

POLISH_ERROR = "Nie udało się uzyskać odpowiedzi. Spróbuj ponownie za chwilę."


class LlmError(Exception):
    def __init__(self, message: str = POLISH_ERROR) -> None:
        super().__init__(message)
        self.message = message


class LlmClient:
    def __init__(self) -> None:
        self.api_key = os.getenv("LLM_API_KEY", "").strip()
        self.model = os.getenv("LLM_MODEL", "gpt-4o-mini").strip()
        self.embedding_model = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small").strip()
        self.embedding_dim = int(os.getenv("EMBEDDING_DIM", "1536"))
        self.base_url = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1").rstrip("/")
        self.timeout = float(os.getenv("LLM_TIMEOUT", "20"))

    def available(self) -> bool:
        return bool(self.api_key)

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    async def _post(self, path: str, payload: dict) -> dict:
        last_status: int | None = None
        timeout = httpx.Timeout(self.timeout, connect=5.0)
        for _attempt in range(2):
            try:
                async with httpx.AsyncClient(timeout=timeout) as client:
                    response = await client.post(
                        f"{self.base_url}{path}",
                        headers=self._headers(),
                        json=payload,
                    )
                if response.status_code >= 400:
                    last_status = response.status_code
                    log.warning("llm http %s", response.status_code)
                    continue
                return response.json()
            except (httpx.TimeoutException, httpx.HTTPError, json.JSONDecodeError):
                log.warning("llm transport failure")
        if last_status:
            log.warning("llm gave up status %s", last_status)
        raise LlmError()

    async def complete_json(self, system: str, user: str, *, temperature: float = 0.2) -> dict:
        if not self.available():
            raise LlmError("Brak konfiguracji modelu. Używamy odpowiedzi zastępczej.")
        data = await self._post(
            "/chat/completions",
            {
                "model": self.model,
                "temperature": temperature,
                "response_format": {"type": "json_object"},
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
            },
        )
        try:
            content = data["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as exc:
            log.warning("llm empty completion")
            raise LlmError() from exc
        return _parse_json(content)

    async def embed(self, text: str) -> list[float]:
        vectors = await self.embed_many([text])
        return vectors[0]

    async def embed_many(self, texts: list[str]) -> list[list[float]]:
        if not self.available():
            raise LlmError()
        vectors: list[list[float]] = []
        for start in range(0, len(texts), 32):
            chunk = texts[start : start + 32]
            data = await self._post(
                "/embeddings",
                {"model": self.embedding_model, "input": chunk},
            )
            try:
                ordered = sorted(data["data"], key=lambda item: item["index"])
                chunk_vectors = [item["embedding"] for item in ordered]
            except (KeyError, TypeError) as exc:
                log.warning("llm bad embedding payload")
                raise LlmError() from exc
            for vector in chunk_vectors:
                if len(vector) != self.embedding_dim:
                    log.error("embedding dim %s expected %s", len(vector), self.embedding_dim)
                    raise LlmError()
            vectors.extend(chunk_vectors)
        return vectors


def _parse_json(content: str) -> dict:
    raw = content.strip()
    fenced = re.search(r"\{.*\}", raw, flags=re.DOTALL)
    if fenced:
        raw = fenced.group(0)
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as exc:
        log.warning("llm non-json")
        raise LlmError() from exc
    if not isinstance(parsed, dict):
        raise LlmError()
    return parsed


llm = LlmClient()
