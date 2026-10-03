"""Help bot: short Polish answers with sources, or a handoff to a person."""

from __future__ import annotations

from pydantic import ValidationError

from catalog import innovations, materials
from db import db
from demo import lookup
from llm import LlmError, llm
from models import ChatRequest, ChatResponse, Source
from util import fold, limit_sentences, read_prompt, read_repo_text

MODULES = (
    ("Dopasuj rozwiązanie", "/dopasuj", "Mieszkaniec opisuje problem i dostaje kilka pasujących innowacji."),
    ("Biblioteka", "/biblioteka", "Karty innowacji, oceny i zapisy do testu."),
    ("Wyzwania", "/wyzwania", "Problemy gmin i powiatów opisane prostym językiem."),
    ("Materiały", "/materialy", "Poradniki, raporty i karty pracy."),
    ("Kreator", "/kreator", "Fiszka pomysłu, asystent i szkic wniosku."),
    ("Middleman", "/middleman", "Gmina układa z asystentem szkic usługi."),
    ("Kontakt", "/kontakt", "Wiadomość do człowieka, gdy bot nie wystarcza."),
    ("Moje zgłoszenia", "/moje-zgloszenia", "Status spraw wysłanych w tej przeglądarce."),
    ("Panel administratora", "/admin", "Pracownik ROPS czyta zgłoszenia i publikuje pomysły."),
)

_HANDOFF = ("czlowiek", "konsultant", "pracownik", "telefon", "kontakt", "osoba")

_FALLBACK_FAQ = """
Jak zgłosić pomysł? Wejdź w Kreator, opisz problem i wyślij fiszkę.
Jak znaleźć gotowe rozwiązanie? Wejdź w Dopasuj i opisz, co się dzieje.
Jak zgłosić się do testu? Otwórz kartę innowacji w bibliotece i wybierz „Chcę przetestować”.
Gdzie zobaczę status sprawy? W Moje zgłoszenia.
"""


def _faq() -> str:
    return read_repo_text("docs/content/faq.md") or _FALLBACK_FAQ


def _faq_pairs() -> list[tuple[str, str]]:
    pairs: list[tuple[str, str]] = []
    question = ""
    body: list[str] = []
    for line in _faq().splitlines():
        stripped = line.strip()
        if stripped.startswith("## "):
            if question and body:
                pairs.append((question, " ".join(body)))
            question = stripped.split(". ", 1)[-1].strip()
            body = []
        elif stripped and stripped != "---":
            body.append(stripped)
    if question and body:
        pairs.append((question, " ".join(body)))
    return pairs


def _faq_source(question: str) -> Source:
    folded = fold(question)
    if "middleman" in folded:
        return Source(title="Middleman", url="/middleman")
    if any(token in folded for token in ("grant", "wniosek", "kreator", "pomysl", "praktyk")):
        return Source(title="Kreator", url="/kreator")
    if any(token in folded for token in ("kontakt", "pracownik")):
        return Source(title="Kontakt", url="/kontakt")
    if any(token in folded for token in ("zgloszen", "status")):
        return Source(title="Moje zgłoszenia", url="/moje-zgloszenia")
    if "test" in folded:
        return Source(title="Biblioteka", url="/biblioteka")
    if any(token in folded for token in ("znalezc", "pomoc", "rozwiazan")):
        return Source(title="Znajdź pomoc", url="/dopasuj")
    return Source(title="Materiały", url="/materialy")


def _best_faq(message: str) -> tuple[str, str, Source] | None:
    best: tuple[int, str, str] | None = None
    for question, answer in _faq_pairs():
        score = _overlap(message, question + " " + answer)
        if best is None or score > best[0]:
            best = (score, question, answer)
    if best is None or best[0] < 2:
        return None
    return best[1], best[2], _faq_source(best[1])


async def _context_bits() -> tuple[list[dict], list[dict]]:
    innovation_rows = innovations()
    material_rows = materials()
    if db.enabled():
        published = await db.list_published()
        if published:
            innovation_rows = published
        remote_materials = await db.list_materials()
        if remote_materials:
            material_rows = remote_materials
    return innovation_rows, material_rows


def _overlap(message: str, text: str) -> int:
    words = {token for token in fold(message).split() if len(token) > 3}
    haystack = fold(text)
    return sum(1 for word in words if word[:5] in haystack)


def _pick(message: str, rows: list[dict], limit: int) -> list[dict]:
    scored = sorted(
        rows,
        key=lambda row: _overlap(message, " ".join(str(value) for value in row.values())),
        reverse=True,
    )
    return [row for row in scored if _overlap(message, " ".join(str(value) for value in row.values())) > 0][:limit]


async def chat(req: ChatRequest) -> ChatResponse:
    cached = lookup("/chat", req.model_dump(mode="json"))
    if cached:
        parsed = ChatResponse.model_validate(cached)
        return parsed.model_copy(update={"reply": limit_sentences(parsed.reply, 5)})
    innovation_rows, material_rows = await _context_bits()
    picked_innovations = _pick(req.message, innovation_rows, 4)
    picked_materials = _pick(req.message, material_rows, 2)
    module_hits = [item for item in MODULES if _overlap(req.message, item[0] + " " + item[2]) > 0][:3]
    wants_person = any(token in fold(req.message) for token in _HANDOFF)
    faq_hit = _best_faq(req.message)
    if faq_hit and not wants_person and not llm.available():
        question, answer, source = faq_hit
        return ChatResponse(reply=limit_sentences(answer, 5), sources=[source], handoff=False)
    if llm.available():
        context = _render_context(picked_innovations, picked_materials)
        raw = await llm.complete_json(
            read_prompt("chat.md"),
            "TASK:chat\n"
            f"STRONA: {req.page or 'nieznana'}\n"
            f"KONTEKST:\n{context}\nFAQ:\n{_faq()}\n"
            f"WIADOMOŚĆ: {req.message}",
            temperature=0.3,
        )
        try:
            parsed = ChatResponse.model_validate(raw)
        except ValidationError as exc:
            raise LlmError() from exc
        sources = _known_sources(parsed.sources, picked_innovations, picked_materials, module_hits)
        return ChatResponse(
            reply=limit_sentences(parsed.reply, 5),
            sources=sources,
            handoff=parsed.handoff or wants_person,
        )
    if wants_person or (not picked_innovations and not module_hits and not picked_materials):
        return ChatResponse(
            reply="Nie chcę zgadywać. Napisz do nas przez formularz kontaktu — odpisze osoba z zespołu.",
            sources=[Source(title="Kontakt", url="/kontakt")],
            handoff=True,
        )
    sources: list[Source] = []
    sentences: list[str] = []
    if module_hits:
        title, url, blurb = module_hits[0]
        sentences.append(f"Zajrzyj do „{title}”. {blurb}")
        sources.append(Source(title=title, url=url))
    if picked_innovations:
        top = picked_innovations[0]
        sentences.append(f"W bibliotece jest „{top.get('title')}”: {top.get('summary')}")
        sources.append(Source(title=str(top.get("title")), url=f"/biblioteka/{top.get('id')}"))
    if not sentences:
        sentences.append("Platforma łączy opis problemu z gotowymi innowacjami, kreatorem pomysłu i pomocą dla gminy.")
        sources.append(Source(title="Dopasuj rozwiązanie", url="/dopasuj"))
    return ChatResponse(reply=limit_sentences(" ".join(sentences), 5), sources=sources[:4], handoff=False)


def _render_context(innovations_rows, material_rows) -> str:
    lines = ["Moduły:"]
    for title, url, blurb in MODULES:
        lines.append(f"- {title} ({url}): {blurb}")
    lines.append("Innowacje:")
    for row in innovations_rows or innovations()[:6]:
        lines.append(f"- {row.get('title')}: {row.get('summary')} (/biblioteka/{row.get('id')})")
    lines.append("Materiały:")
    for row in material_rows:
        lines.append(f"- {row.get('title')}: {row.get('description') or ''} ({row.get('url') or '/materialy'})")
    return "\n".join(lines)


def _known_sources(proposed, innovations_rows, material_rows, module_hits) -> list[Source]:
    allowed = {url for _, url, _ in MODULES}
    allowed.update(f"/biblioteka/{row.get('id')}" for row in innovations_rows)
    for row in material_rows:
        if row.get("url"):
            allowed.add(str(row["url"]))
    sources = [source for source in proposed if source.url in allowed]
    if sources:
        return sources[:4]
    return [Source(title=title, url=url) for title, url, _ in (module_hits or MODULES[:1])]
