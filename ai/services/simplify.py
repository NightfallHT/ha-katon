"""Easy-read Polish. Live model when a key is set, otherwise a local rewrite."""

from __future__ import annotations

import re

from demo import lookup
from llm import LlmError, llm
from models import SimplifyRequest, SimplifyResponse
from util import limit_words, read_prompt

_SPLIT = re.compile(r"[,;:]|\s+oraz\s+|\s+albo\s+", re.IGNORECASE)


def easy_read(text: str) -> str:
    parts = [part.strip(" .") for part in _SPLIT.split(text) if part.strip()]
    sentences: list[str] = []
    for part in parts:
        if len(part.split()) < 3:
            continue
        sentences.append(part[0].upper() + part[1:] + ".")
        if len(sentences) >= 5:
            break
    if not sentences:
        return limit_words(text, 80)
    return limit_words(" ".join(sentences), 80)


async def simplify(req: SimplifyRequest) -> SimplifyResponse:
    cached = lookup("/simplify", req.model_dump(mode="json"))
    if cached:
        parsed = SimplifyResponse.model_validate(cached)
        return SimplifyResponse(text=limit_words(parsed.text, 80))
    if llm.available():
        raw = await llm.complete_json(
            read_prompt("simplify.md"),
            f"TASK:simplify\nTEKST: {req.text}",
            temperature=0.3,
        )
        rewritten = str(raw.get("text") or "").strip()
        if not rewritten:
            raise LlmError()
        return SimplifyResponse(text=limit_words(rewritten, 80))
    return SimplifyResponse(text=easy_read(req.text))
