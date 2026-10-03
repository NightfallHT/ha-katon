"""Matchmaking: extract, embed, hybrid boost, rerank, store the need."""

from __future__ import annotations

import re
import uuid
from typing import Any

from pydantic import ValidationError

from catalog import innovations
from db import db
from demo import lookup
from llm import LlmError, llm
from models import Extracted, MatchRequest, MatchResponse, MatchResult, SimilarNeeds
from util import fold, read_prompt

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
    if any(token in folded for token in ("gluch", "nieslysz", "slabo slys")):
        extra.extend(["gluch", "pjm"])
    if "samot" in folded:
        extra.append("samotn")
    if any(token in folded for token in ("lekarz", "dojazd", "dojech", "transport")):
        extra.extend(["dojazd", "lekarz"])
    if "niepelnospraw" in folded or "syna" in folded:
        extra.append("niepelnospraw")
    seen: list[str] = []
    for word in words + extra:
        if word not in seen:
            seen.append(word)
    return seen


def _keyword_score(query: str, item: dict[str, Any]) -> float:
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
    query_words = _needles(query)
    if not query_words:
        return 0.35
    hits = sum(1 for word in query_words if _stem_hit(word, haystack))
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
    return min(0.9, max(0.2, 0.22 + 0.1 * hits))


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
    keyword = extracted.keywords[0] if extracted.keywords else "ten problem"
    return f"To jest blisko tego, co opisujesz: {keyword} i {extracted.target_group}."


def _rank_local(query: str, extracted: Extracted) -> list[tuple[float, dict[str, Any]]]:
    ranked = []
    for item in innovations():
        base = _keyword_score(query, item)
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
    ranked = _rank_local(req.query, extracted)
    low = not ranked or ranked[0][0] < LOW_CONFIDENCE_THRESHOLD
    return MatchResponse(
        need_id=str(uuid.uuid4()),
        extracted=extracted,
        results=_results_from_ranked(ranked, extracted, low),
        similar_needs=_mock_similar(extracted.category),
    )


async def _match_live(req: MatchRequest) -> MatchResponse:
    extracted_raw = await llm.complete_json(
        read_prompt("match_extract.md"),
        f"TASK:match_extract\nZAPYTANIE: {req.query}\nLOKALIZACJA: {req.location or 'brak'}",
        temperature=0.1,
    )
    try:
        extracted = Extracted.model_validate(extracted_raw)
    except ValidationError as exc:
        raise LlmError() from exc

    ranked: list[tuple[float, dict[str, Any]]] = []
    if db.enabled():
        vector = await llm.embed(req.query + " " + " ".join(extracted.keywords))
        rows = await db.match_innovations(vector, 10)
        for row in rows:
            similarity = float(row.get("similarity") or 0)
            ranked.append((hybrid_score(similarity, row, extracted), row))
        ranked.sort(key=lambda pair: pair[0], reverse=True)
    if not ranked:
        ranked = _rank_local(req.query, extracted)

    candidates = []
    for score, item in ranked[:10]:
        candidates.append(
            {
                "innovation_id": str(item.get("id")),
                "title": item.get("title"),
                "summary": item.get("summary"),
                "category": item.get("category"),
                "tags": item.get("tags") or [],
                "score": score,
            }
        )
    rerank_raw = await llm.complete_json(
        read_prompt("match_rerank.md"),
        "TASK:match_rerank\nPROBLEM: "
        + req.query
        + "\nKANDYDACI: "
        + _compact(candidates),
        temperature=0.2,
    )
    by_id = {str(item.get("id")): (score, item) for score, item in ranked}
    results = _apply_rerank(rerank_raw, by_id, extracted)
    low = bool(rerank_raw.get("low_confidence")) or not results or results[0].score < LOW_CONFIDENCE_THRESHOLD
    if low:
        results = [item.model_copy(update={"score": min(item.score, 0.49)}) for item in results]

    similar_count = 0
    example = None
    need_id = str(uuid.uuid4())
    if db.enabled():
        similar = await db.similar_needs(extracted.category)
        similar_count = int(similar["count"])
        example = similar["example"]
        inserted = await db.insert_need(
            text=req.query,
            category=extracted.category,
            target_group=extracted.target_group,
            location=extracted.location,
            keywords=extracted.keywords,
            role=req.role,
        )
        if inserted:
            need_id = inserted
    else:
        mocked = _mock_similar(extracted.category)
        similar_count = mocked.count
        example = mocked.example

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
