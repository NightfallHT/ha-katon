"""Admin helpers: plain-language summary and embedding refresh."""

from __future__ import annotations

from pydantic import ValidationError

from demo import lookup
from llm import LlmError, llm
from models import EnrichRequest, EnrichResponse, ReembedResponse, coerce_category
from services.match import _mock_extract, innovation_embed_text
from util import first_sentence, read_prompt
from db import db


async def enrich(req: EnrichRequest) -> EnrichResponse:
    cached = lookup("/admin/enrich", req.model_dump(mode="json"))
    if cached:
        return EnrichResponse.model_validate(cached)
    if llm.available():
        raw = await llm.complete_json(
            read_prompt("enrich.md"),
            f"TASK:enrich\nTEKST: {req.text}",
            temperature=0.2,
        )
        try:
            parsed = EnrichResponse.model_validate(raw)
        except ValidationError as exc:
            raise LlmError() from exc
        tags = [tag.strip() for tag in parsed.tags if tag.strip()][:6]
        if len(tags) < 3:
            tags = (tags + _mock_extract(req.text, None).keywords)[:6]
        summary = first_sentence(parsed.summary)
        return EnrichResponse(summary=summary, tags=tags[:6], category=coerce_category(parsed.category))
    extracted = _mock_extract(req.text, None)
    tags = extracted.keywords[:6]
    while len(tags) < 3:
        tags.append(extracted.category)
    return EnrichResponse(
        summary=first_sentence(req.text) or "Zgłoszenie opisuje problem społeczny do dalszej oceny.",
        tags=tags[:6],
        category=extracted.category,
    )


async def reembed() -> ReembedResponse:
    if not db.enabled() or not llm.available():
        return ReembedResponse(updated=0)
    rows = await db.list_innovations()
    if not rows:
        return ReembedResponse(updated=0)
    texts = [innovation_embed_text(row) for row in rows]
    vectors = await llm.embed_many(texts)
    updated = 0
    for row, vector in zip(rows, vectors):
        if await db.update_embedding(str(row["id"]), vector):
            updated += 1
    return ReembedResponse(updated=updated)
