"""Matchmaking: extract, embed, hybrid boost, rerank, store the need."""

from __future__ import annotations

import asyncio
import logging
import os
import re
import uuid
from typing import Any

from catalog import innovations
from db import db
from demo import lookup
from llm import LlmError, llm
from models import Extracted, MatchRequest, MatchResponse, MatchResult, SimilarNeeds
from util import fold, read_prompt

log = logging.getLogger("ai.match")

# Ola shows "zgłoś jako nowy pomysł" when the top score is below this value.
LOW_CONFIDENCE_THRESHOLD = 0.5

_WORD = re.compile(r"[a-z0-9ąćęłńóśźż]{4,}", re.IGNORECASE)

_STOP = {
    "malo",
    "malopolsce",
    "malopolski",
    "malopolska",
    "innowacji",
    "innowacje",
    "innowacja",
    "osob",
    "osoby",
    "chce",
    "wiedziec",
    "pokaz",
    "skorzystac",
    "takich",
    "jakie",
    "jakich",
    "projekty",
    "projekt",
    "moge",
    "moga",
    "jest",
    "tego",
    "chcemy",
    "jakie",
}


def _terms(text: str) -> list[str]:
    seen: list[str] = []
    for token in _WORD.findall(text):
        word = token.lower()
        if word not in seen:
            seen.append(word)
    return seen


def _stem_hit(word: str, haystack: str) -> bool:
    folded = fold(word)
    stem = folded[:5]
    return folded in haystack or (len(stem) >= 4 and stem in haystack)


def _needles(query: str) -> list[str]:
    folded = fold(query)
    words = [word for word in _terms(query) if fold(word) not in _STOP]
    extra: list[str] = []
    if any(token in folded for token in ("widze", "niewidom", "wzrok", "braille", "niedowid")):
        extra.extend(["niewidom", "wzrok", "braille", "audiodeskrypc"])
    if any(token in folded for token in ("gluch", "nieslysz", "slabo slys", "migow")):
        extra.extend(["gluch", "pjm", "migow", "nieslysz"])
    if any(token in folded for token in ("samot", "osamot", "izol")):
        extra.extend(["samotn", "senior", "starsz"])
    if any(token in folded for token in ("lekarz", "dojazd", "dojech", "transport", "przychod")):
        extra.extend(["dojazd", "lekarz", "senior"])
    if any(token in folded for token in ("niepelnospraw", "syna", "wozek", "barier")):
        extra.extend(["niepelnospraw", "dostep", "barier"])
    if any(token in folded for token in ("wytchn", "opiekun", "opieka", "opiek")):
        extra.extend(["opiek", "rodzic", "dziec", "rodzin"])
    if any(token in folded for token in ("depres", "psych", "stres", "samoboj", "lęk", "lek ")):
        extra.extend(["psych", "depres", "zdrow"])
    if any(token in folded for token in ("praca", "bezrob", "zatrud")):
        extra.extend(["praca", "zatrud", "mlodz"])
    if any(token in folded for token in ("senior", "starsz", "emeryt")):
        extra.extend(["senior", "starsz", "samot"])
    seen: list[str] = []
    for word in words + extra:
        if word not in seen:
            seen.append(word)
    return seen


# The query must share the kind of problem, not only a broad label such as "disability".
_SITUATIONS = (
    (("wytchn", "odciaz"), ("wytchn", "odciaz", "wypal", "zastep", "odpocz")),
    (("nieslysz", "gluch", "migow", "pjm"), ("gluch", "pjm", "migow", "nieslysz")),
    (("niewid", "braille", "niedowid"), ("niewid", "braille", "wzrok", "audiod")),
    (("dojazd", "dojech", "lekarz", "przychod"), ("dojazd", "lekarz", "przychod", "transport")),
    (("samot", "osamot"), ("samot", "izol", "towarz")),
    (("wychodz", "boi sie", "boje sie"), ("samot", "izol", "towarz")),
)


def _situation_delta(query: str, haystack: str) -> float:
    folded = fold(query)
    delta = 0.0
    for triggers, problems in _SITUATIONS:
        if not any(token in folded for token in triggers):
            continue
        if any(_stem_hit(token, haystack) for token in problems):
            delta += 0.3
        else:
            delta -= 0.35
    return delta


def _for_institution(role: str | None) -> bool:
    return fold(role or "") in {"gmina", "ngo", "instytucja", "institution"}


def _audience_delta(role: str | None, item: dict[str, Any]) -> float:
    text = fold(
        " ".join(
            [
                str(item.get("summary") or ""),
                str(item.get("description") or ""),
                " ".join(item.get("target_groups") or []),
            ]
        )
    )
    groups = fold(" ".join(item.get("target_groups") or []))
    can_run = any(token in text for token in ("wdroz", "gmin", "samorz", "organizacj", " ops", "ngo", "jst", "placow"))
    for_person = any(
        token in groups
        for token in ("senior", "rodzic", "mieszkan", "osob", "dziec", "rodzin", "opiekun", "niewid", "gluch", "nieslys")
    )
    if _for_institution(role):
        if can_run and not for_person:
            return 0.55
        if can_run:
            return 0.35
        return -0.5
    if for_person and not can_run:
        return 0.45
    if for_person:
        return -0.05
    return -0.35


def _keyword_score(query: str, item: dict[str, Any], role: str | None = None) -> float:
    haystack = fold(
        " ".join(
            [
                str(item.get("title") or ""),
                str(item.get("summary") or ""),
                str(item.get("description") or ""),
                " ".join(item.get("tags") or []),
                " ".join(item.get("target_groups") or []),
            ]
        )
    )
    direct = [word for word in _terms(query) if fold(word) not in _STOP]
    associated = [word for word in _needles(query) if word not in direct]
    if not direct and not associated:
        return 0.35
    # A word from the query counts more than a loose association.
    hits = sum(2 for word in direct if _stem_hit(word, haystack))
    hits += sum(1 for word in associated if _stem_hit(word, haystack))
    folded_query = fold(query)
    about_vision = any(token in folded_query for token in ("widze", "niewidom", "wzrok", "niedowid"))
    about_child = any(token in folded_query for token in ("dziec", "syna", "syn "))
    if about_vision and ("audiodeskrypc" in haystack or "etykiet" in haystack):
        hits += 2
    if about_vision and "braille" in haystack and "dziec" in haystack and not about_child:
        hits -= 2
    if about_vision and "gluch" in haystack and "audiodeskrypc" not in haystack:
        hits -= 2
    if about_child and any(token in haystack for token in ("dziec", "uczn", "mlodzie", "rodzin")):
        hits += 1
    # More matching words keep ranking above a loose association. Zero hits stay visible.
    floor = 0.08 if hits <= 0 else 0.2
    score = floor + 0.06 * max(hits, 0) + _situation_delta(query, haystack) + _audience_delta(role, item)
    return round(min(0.96, max(0.02, score)), 4)


def hybrid_score(base: float, item: dict[str, Any], extracted: Extracted) -> float:
    score = base
    if item.get("category") == extracted.category:
        score += 0.12
    tags = [fold(str(tag)) for tag in item.get("tags") or []]
    overlap = 0
    for keyword in extracted.keywords:
        if any(_stem_hit(keyword, tag) or _stem_hit(tag, fold(keyword)) for tag in tags if tag):
            overlap += 1
    score += min(0.2, 0.05 * overlap)
    return round(min(score, 0.97), 4)


def _mock_extract(query: str, location: str | None) -> Extracted:
    folded = fold(query)
    category = "inne"
    rules = (
        (("widze", "niewidom", "wzrok", "braille", "niedowid"), "niepelnosprawnosc"),
        (("samot", "osamot"), "samotnosc"),
        (("lekarz", "dojazd", "dowoz", "transport", "przychod"), "dostep_do_uslug"),
        (("internet", "erecept", "komputer", "cyfr"), "wykluczenie_cyfrowe"),
        (("mlodzie", "nastr", "psych"), "zdrowie_psychiczne"),
        (("niepelnospraw", "wozek", "dostepn"), "niepelnosprawnosc"),
        (("dziec", "rodzic", "zlob"), "rodzina_dzieci"),
        (("cwicz", "rehabil"), "starzenie"),
        (("ngo", "organizacj", "partner"), "wspolpraca_miedzysektorowa"),
        (("sasiad", "integrac"), "integracja_spoleczna"),
    )
    for needles, slug in rules:
        if any(needle in folded for needle in needles):
            category = slug
            break
    if any(token in folded for token in ("widze", "niewidom", "wzrok", "niedowid")):
        target = "osoby słabowidzące"
    elif "syna" in folded or "niepelnospraw" in folded:
        target = "osoby z niepełnosprawnością i ich bliscy"
    elif "senior" in folded or "stars" in folded:
        target = "seniorzy"
    elif "mlodzie" in folded:
        target = "młodzież"
    elif "dziec" in folded or "rodzic" in folded:
        target = "rodziny z dziećmi"
    else:
        target = "mieszkańcy"
    keywords = _terms(query)[:6] or ["problem"]
    place = location
    if not place and any(token in folded for token in ("wiejsk", "wsi", "gmin")):
        place = "gmina wiejska"
    return Extracted(category=category, target_group=target, location=place, keywords=keywords)


def _why(item: dict[str, Any], extracted: Extracted) -> str:
    summary = " ".join(str(item.get("summary") or "").split())
    return summary or "To rozwiązanie odpowiada na opisaną sprawę."


def _rank_local(query: str, extracted: Extracted, role: str | None = None) -> list[tuple[float, dict[str, Any]]]:
    ranked = []
    for item in innovations():
        base = _keyword_score(query, item, role)
        ranked.append((hybrid_score(base, item, extracted), item))
    ranked.sort(key=lambda pair: pair[0], reverse=True)
    return ranked[:10]


def _results_from_ranked(ranked: list[tuple[float, dict[str, Any]]], extracted: Extracted, low: bool) -> list[MatchResult]:
    chosen = ranked[:5]
    if len(chosen) > 5:
        chosen = chosen[:5]
    if len(chosen) < 3:
        pool = chosen
    else:
        pool = chosen[:5]
    results: list[MatchResult] = []
    for score, item in pool[:5]:
        shown = min(score, 0.49) if low else score
        results.append(
            MatchResult(
                innovation_id=str(item.get("id")),
                title=str(item.get("title") or "Innowacja"),
                summary=str(item.get("summary") or ""),
                category=str(item.get("category") or "inne"),
                score=round(shown, 4),
                why=_why(item, extracted),
            )
        )
    return results[:5]


def _mock_similar(category: str) -> SimilarNeeds:
    examples = {
        "samotnosc": "Seniorzy w gminie wiejskiej nie mają z kim wyjść z domu.",
        "dostep_do_uslug": "Nie ma jak dojechać do lekarza z dalszej wsi.",
        "wykluczenie_cyfrowe": "Trudno załatwić e-receptę bez pomocy.",
    }
    if category in examples:
        return SimilarNeeds(count=12, example=examples[category])
    return SimilarNeeds(count=3, example=None)


def _bind_cached(payload: dict[str, Any]) -> dict[str, Any]:
    by_title = {str(item.get("title")): str(item.get("id")) for item in innovations()}
    bound = []
    for result in payload.get("results") or []:
        title = str(result.get("title") or "")
        if title in by_title:
            result = {**result, "innovation_id": by_title[title]}
        bound.append(result)
    return {**payload, "results": bound}


async def match(req: MatchRequest) -> MatchResponse:
    cached = lookup("/match", req.model_dump(mode="json"))
    if cached:
        return MatchResponse.model_validate(_bind_cached(cached))
    if llm.available():
        return await _match_live(req)
    return _match_mock(req)


def _match_mock(req: MatchRequest) -> MatchResponse:
    extracted = _mock_extract(req.query, req.location)
    ranked = _rank_local(req.query, extracted, req.role)
    low = not ranked or ranked[0][0] < LOW_CONFIDENCE_THRESHOLD
    return MatchResponse(
        need_id=str(uuid.uuid4()),
        extracted=extracted,
        results=_results_from_ranked(ranked, extracted, low),
        similar_needs=_mock_similar(extracted.category),
    )


async def _vector_ranked(req: MatchRequest, extracted: Extracted) -> list[tuple[float, dict[str, Any]]]:
    if not db.enabled():
        return []
    vector = await llm.embed(req.query + " " + " ".join(extracted.keywords))
    rows = await db.match_innovations(vector, 10)
    ranked = [
        (hybrid_score(float(row.get("similarity") or 0), row, extracted), row)
        for row in rows
    ]
    ranked.sort(key=lambda pair: pair[0], reverse=True)
    return ranked


async def _store_need(req: MatchRequest, extracted: Extracted) -> None:
    try:
        await asyncio.wait_for(
            db.insert_need(
                text=req.query,
                category=extracted.category,
                target_group=extracted.target_group,
                location=extracted.location,
                keywords=extracted.keywords,
                role=req.role,
            ),
            timeout=8,
        )
    except (asyncio.TimeoutError, Exception):
        log.warning("need was not stored")


async def _match_live(req: MatchRequest) -> MatchResponse:
    extracted = _mock_extract(req.query, req.location)
    ranked: list[tuple[float, dict[str, Any]]] = []
    # Vector search is off until innovations have embeddings. The empty RPC was
    # slower than the page timeout, so every query fell back to one local answer.
    if os.getenv("MATCH_VECTOR", "0").strip().lower() in {"1", "true", "yes"}:
        try:
            ranked = await asyncio.wait_for(_vector_ranked(req, extracted), timeout=4)
        except (asyncio.TimeoutError, LlmError):
            ranked = []
    if not ranked:
        ranked = _rank_local(req.query, extracted, req.role)

    candidates = []
    for score, item in ranked[:5]:
        summary = " ".join(str(item.get("summary") or "").split())
        candidates.append(
            {
                "innovation_id": str(item.get("id")),
                "title": item.get("title"),
                "summary": summary[:180],
                "category": item.get("category"),
                "tags": [],
                "score": score,
            }
        )
    by_id = {str(item.get("id")): (score, item) for score, item in ranked}
    results = _results_from_ranked(ranked, extracted, False)
    rerank_raw: dict[str, Any] = {}
    try:
        rerank_raw = await llm.complete_json(
            read_prompt("match_rerank.md"),
            (
                "Szuka instytucja, która chce to wdrożyć u siebie. "
                "Pokazuj modele do prowadzenia przez gminę, OPS albo organizację, nie udogodnienie dla jednej osoby.\n"
                if _for_institution(req.role)
                else "Szuka osoba prywatna. Pokazuj to, z czego może skorzystać osobiście, nie instrukcję wdrożenia dla urzędu.\n"
            )
            + "Zostaw tylko inicjatywy, z których ten odbiorca realnie skorzysta w opisanej sprawie. "
            "Osobie niewidomej nie podawaj kursu dla osób głuchych. "
            "Pusta lista dopiero wtedy, gdy żaden kandydat by jej nie pomógł. "
            "W why napisz, jak to jej pomaga, bez wstępu w rodzaju „to skojarzenie”.\n"
            "SPRAWA: "
            + req.query
            + "\nKANDYDACI:\n"
            + _compact(candidates),
            temperature=0,
            timeout=35,
            attempts=1,
            max_tokens=350,
        )
        reranked = _apply_rerank(rerank_raw, by_id, extracted)
        if reranked:
            results = reranked
    except LlmError:
        rerank_raw = {}
    low = bool(rerank_raw.get("low_confidence")) or not results or results[0].score < LOW_CONFIDENCE_THRESHOLD
    if low:
        results = [item.model_copy(update={"score": min(item.score, 0.49)}) for item in results]

    mocked = _mock_similar(extracted.category)
    similar_count = mocked.count
    example = mocked.example
    need_id = str(uuid.uuid4())
    if db.enabled():
        asyncio.create_task(
            _store_need(req, extracted),
            name="store-need",
        )

    return MatchResponse(
        need_id=need_id,
        extracted=extracted,
        results=results[:5],
        similar_needs=SimilarNeeds(count=similar_count, example=example),
    )


def _apply_rerank(
    payload: dict[str, Any],
    by_id: dict[str, tuple[float, dict[str, Any]]],
    extracted: Extracted,
) -> list[MatchResult]:
    items = payload.get("items") if isinstance(payload, dict) else None
    results: list[MatchResult] = []
    if isinstance(items, list):
        for entry in items:
            if not isinstance(entry, dict):
                continue
            innovation_id = str(entry.get("innovation_id") or "")
            if innovation_id not in by_id:
                continue
            score, item = by_id[innovation_id]
            why = str(entry.get("why") or "").strip() or _why(item, extracted)
            results.append(
                MatchResult(
                    innovation_id=innovation_id,
                    title=str(item.get("title") or ""),
                    summary=str(item.get("summary") or ""),
                    category=str(item.get("category") or "inne"),
                    score=round(float(score), 4),
                    why=why.split(".")[0].strip() + "." if "." in why else why,
                )
            )
            if len(results) == 5:
                break
    if len(results) < 3:
        for score, item in list(by_id.values())[:5]:
            innovation_id = str(item.get("id"))
            if any(existing.innovation_id == innovation_id for existing in results):
                continue
            results.append(
                MatchResult(
                    innovation_id=innovation_id,
                    title=str(item.get("title") or ""),
                    summary=str(item.get("summary") or ""),
                    category=str(item.get("category") or "inne"),
                    score=round(float(score), 4),
                    why=_why(item, extracted),
                )
            )
            if len(results) == 5:
                break
    return results


def _compact(candidates: list[dict[str, Any]]) -> str:
    parts = []
    for item in candidates:
        parts.append(
            f"{item['innovation_id']} | {item['title']} | {item['summary']} | {item['category']} | {', '.join(item['tags'])}"
        )
    return "\n".join(parts)


def innovation_embed_text(item: dict[str, Any]) -> str:
    tags = " ".join(item.get("tags") or [])
    groups = " ".join(item.get("target_groups") or [])
    return " ".join(
        part
        for part in (
            str(item.get("title") or ""),
            str(item.get("summary") or ""),
            str(item.get("description") or ""),
            tags,
            groups,
        )
        if part
    )
