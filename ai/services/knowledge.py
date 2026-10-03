"""Knowledge-base report: structured LLM brief over local catalog."""

from __future__ import annotations

import re
from typing import Any

from catalog import challenges, innovations, materials
from llm import LlmError, llm
from models import (
    KnowledgeInnovation,
    KnowledgeMaterial,
    KnowledgeMetric,
    KnowledgeReportRequest,
    KnowledgeReportResponse,
)
from util import fold, read_prompt

_WORD = re.compile(r"[a-z0-9ąćęłńóśźż]{3,}", re.IGNORECASE)
_STOP = {
    "dla",
    "oraz",
    "jest",
    "tego",
    "chce",
    "chcemy",
    "szukam",
    "potrzebujemy",
    "malopolsce",
    "malopolski",
    "malopolska",
}


def _terms(text: str) -> list[str]:
    seen: list[str] = []
    for token in _WORD.findall(text):
        word = fold(token)
        if word in _STOP or word in seen:
            continue
        seen.append(word)
    return seen


def _score(query: str, *parts: object) -> int:
    haystack = fold(" ".join(str(part or "") for part in parts))
    return sum(1 for term in _terms(query) if term in haystack)


def _pick(items: list[dict[str, Any]], query: str, limit: int) -> list[dict[str, Any]]:
    ranked = sorted(items, key=lambda item: _score(query, *item.values()), reverse=True)
    useful = [item for item in ranked if _score(query, *item.values()) > 0]
    chosen = useful or ranked
    return chosen[:limit]


def _text(item: dict[str, Any], *keys: str) -> str:
    return " ".join(str(item.get(key) or "") for key in keys).strip()


def _local_report(body: KnowledgeReportRequest) -> KnowledgeReportResponse:
    query = body.query.strip()
    audience_label = "osób fizycznych" if body.audience == "person" else "instytucji"
    innos = _pick(innovations(), query, 4)
    mats = _pick(materials(), query, 4)
    works_src = _pick(challenges(), query, 3) or challenges()[:3]
    deployed = [
        item
        for item in innos
        if fold(str(item.get("stage") or "")) in {"wdrozona", "wdrożona", "dziala"}
    ]

    what_works: list[str] = []
    for item in deployed or innos[:3]:
        title = str(item.get("title") or "To rozwiązanie")
        summary = str(item.get("summary") or item.get("description") or "").strip()
        what_works.append(f"{title}: {summary}" if summary else title)
    for item in works_src:
        title = str(item.get("title") or "")
        description = str(item.get("description") or "")
        if title and description:
            what_works.append(f"{title} — {description}")
        elif title:
            what_works.append(title)

    unique_works: list[str] = []
    for line in what_works:
        if line not in unique_works:
            unique_works.append(line)

    topic = query.rstrip(".!?")
    title = f"Co już wiemy o: {topic}"
    if len(title) > 90:
        title = "Raport z zasobnika wiedzy"
    summary = (
        f"Dla {audience_label} zebraliśmy {len(innos)} inicjatywy i {len(mats)} materiały "
        f"pasujące do zapytania „{topic}”. Poniżej jest skrót tego, co już działa, oraz linki do dalszej lektury."
    )

    return KnowledgeReportResponse(
        title=title,
        summary=summary,
        metrics=[
            KnowledgeMetric(value=str(len(innos)), label="pasujące innowacje"),
            KnowledgeMetric(value=str(len(mats)), label="materiały do przeczytania"),
            KnowledgeMetric(
                value=str(len(deployed) or min(len(innos), 2)),
                label="rozwiązania, które już działają",
            ),
        ],
        what_works=unique_works[:5] or ["W tej chwili mamy za mało pewnych przykładów. Warto dopytać zespół ROPS."],
        innovations=[
            KnowledgeInnovation(
                innovation_id=str(item.get("id") or ""),
                title=str(item.get("title") or "Innowacja"),
                summary=str(item.get("summary") or item.get("description") or ""),
            )
            for item in innos
        ],
        materials=[
            KnowledgeMaterial(
                title=str(item.get("title") or "Materiał"),
                url=str(item.get("url") or "/materialy"),
                description=str(item.get("description") or ""),
            )
            for item in mats
        ],
    )


def _context(local: KnowledgeReportResponse, body: KnowledgeReportRequest) -> str:
    innos = "\n".join(
        f"- {item.innovation_id} | {item.title} | {item.summary}" for item in local.innovations
    )
    mats = "\n".join(f"- {item.title} | {item.url} | {item.description}" for item in local.materials)
    works = "\n".join(f"- {item}" for item in local.what_works)
    return (
        f"Zapytanie: {body.query}\n"
        f"Odbiorca: {'osoba fizyczna' if body.audience == 'person' else 'instytucja'}\n\n"
        f"Innowacje:\n{innos or '- brak'}\n\n"
        f"Materiały:\n{mats or '- brak'}\n\n"
        f"Co już działa:\n{works or '- brak'}\n"
    )


def _merge(local: KnowledgeReportResponse, raw: dict[str, Any]) -> KnowledgeReportResponse:
    known_innos = {item.innovation_id: item for item in local.innovations}
    known_titles = {fold(item.title): item for item in local.innovations}
    known_mats = {fold(item.title): item for item in local.materials}

    innovations_out: list[KnowledgeInnovation] = []
    for item in raw.get("innovations") or []:
        if not isinstance(item, dict):
            continue
        found = known_innos.get(str(item.get("innovation_id") or "")) or known_titles.get(
            fold(str(item.get("title") or ""))
        )
        if found and found.innovation_id not in {row.innovation_id for row in innovations_out}:
            innovations_out.append(found)
    if not innovations_out:
        innovations_out = local.innovations

    materials_out: list[KnowledgeMaterial] = []
    for item in raw.get("materials") or []:
        if not isinstance(item, dict):
            continue
        found = known_mats.get(fold(str(item.get("title") or "")))
        if found and found.title not in {row.title for row in materials_out}:
            materials_out.append(found)
    if not materials_out:
        materials_out = local.materials

    metrics: list[KnowledgeMetric] = []
    for item in raw.get("metrics") or []:
        if not isinstance(item, dict):
            continue
        value = str(item.get("value") or "").strip()
        label = str(item.get("label") or "").strip()
        if value and label:
            metrics.append(KnowledgeMetric(value=value, label=label))
    if len(metrics) < 2:
        metrics = local.metrics

    what_works = [
        str(item).strip()
        for item in (raw.get("what_works") or [])
        if str(item).strip()
    ] or local.what_works

    title = str(raw.get("title") or "").strip() or local.title
    summary = str(raw.get("summary") or "").strip() or local.summary
    return KnowledgeReportResponse(
        title=title,
        summary=summary,
        metrics=metrics[:3],
        what_works=what_works[:5],
        innovations=innovations_out[:5],
        materials=materials_out[:5],
    )


async def report(body: KnowledgeReportRequest) -> KnowledgeReportResponse:
    local = _local_report(body)
    if not llm.available():
        return local
    try:
        raw = await llm.complete_json(read_prompt("knowledge_report.md"), _context(local, body))
    except LlmError:
        return local
    return _merge(local, raw)
