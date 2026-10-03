"""Middleman: one question at a time, then a cautious service draft."""

from __future__ import annotations

from pydantic import ValidationError

from catalog import innovation_by_id
from db import db
from demo import lookup
from llm import LlmError, llm
from models import (
    ChecklistItem,
    CostItem,
    MiddlemanChatRequest,
    MiddlemanChatResponse,
    MiddlemanReportRequest,
    MiddlemanReportResponse,
    ServiceReport,
)
from util import one_question, read_prompt, read_repo_text

GENERIC_CHECKLIST = (
    "Cel",
    "Grupa docelowa",
    "Partnerzy",
    "Budżet",
    "Wskaźniki",
    "Trwałość",
)

_QUESTIONS = (
    "Kto dokładnie w gminie najbardziej to odczuwa?",
    "Co już u Was działa — na przykład OPS, szkoła albo grupa wolontariuszy?",
    "Kto mógłby to prowadzić razem z gminą: CUS, organizacja społeczna, parafia albo szkoła?",
    "Jakie macie ograniczenia: budżet i liczba osób do pracy?",
)


def user_turns(history_len_user: int) -> int:
    return history_len_user


def _prior_user_messages(history) -> int:
    return sum(1 for message in history if message.role == "user")


def checklist_items() -> list[str]:
    text = read_repo_text("docs/content/usluga-wrazliwa.md")
    if not text:
        return list(GENERIC_CHECKLIST)
    found = []
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith("- "):
            item = stripped[2:].strip()
            if item:
                found.append(item)
    return found or list(GENERIC_CHECKLIST)


def _mark_checklist(items: list[str], blob: str) -> list[ChecklistItem]:
    folded = blob.lower()
    marked: list[ChecklistItem] = []
    for item in items:
        token = item.lower().split()[0]
        marked.append(ChecklistItem(item=item, done=token in folded or item in GENERIC_CHECKLIST))
    return marked


async def _innovation(innovation_id: str) -> dict:
    if db.enabled():
        row = await db.get_innovation(innovation_id)
        if row:
            return row
    return innovation_by_id(innovation_id) or {
        "id": innovation_id,
        "title": "Wybrana innowacja",
        "summary": "Rozwiązanie wybrane przez gminę do dostosowania.",
        "category": "inne",
    }


async def chat(req: MiddlemanChatRequest) -> MiddlemanChatResponse:
    cached = lookup("/middleman/chat", req.model_dump(mode="json"))
    if cached:
        return MiddlemanChatResponse.model_validate(cached)
    turn = _prior_user_messages(req.history) + 1
    if llm.available():
        innovation = await _innovation(req.innovation_id)
        raw = await llm.complete_json(
            read_prompt("middleman_chat.md"),
            "TASK:middleman_chat\n"
            f"TURA: {turn}\n"
            f"INNOWACJA: {innovation.get('title')} — {innovation.get('summary')}\n"
            f"GMINA: {req.gmina.name}, typ {req.gmina.type}, mieszkańców {req.gmina.population}, trend {req.gmina.population_trend}\n"
            f"HISTORIA: {_history(req.history)}\n"
            f"WIADOMOŚĆ: {req.message}",
            temperature=0.4,
        )
        try:
            parsed = MiddlemanChatResponse.model_validate(
                {"reply": one_question(str(raw.get("reply") or "")), "done": bool(raw.get("done"))}
            )
        except ValidationError as exc:
            raise LlmError() from exc
        done = parsed.done or turn > 4
        return MiddlemanChatResponse(reply=parsed.reply, done=done)
    if turn > 4:
        return MiddlemanChatResponse(
            reply="Mam już dość, żeby naszkicować usługę. Możesz przejść do raportu.",
            done=True,
        )
    return MiddlemanChatResponse(reply=_QUESTIONS[min(turn, 4) - 1], done=False)


def _scale_costs(population: int) -> list[CostItem]:
    if population < 8000:
        amounts = (18000, 6000, 4000)
    elif population < 30000:
        amounts = (42000, 12000, 8000)
    else:
        amounts = (90000, 25000, 15000)
    labels = (
        "Koordynacja i wolontariat (szacunek orientacyjny)",
        "Dojazdy i materiały",
        "Spotkania z partnerami",
    )
    return [CostItem(item=label, amount_pln_per_year=amount) for label, amount in zip(labels, amounts)]


async def report(req: MiddlemanReportRequest) -> MiddlemanReportResponse:
    cached = lookup("/middleman/report", req.model_dump(mode="json"))
    if cached:
        return MiddlemanReportResponse.model_validate(cached)
    innovation = await _innovation(req.innovation_id)
    items = checklist_items()
    if llm.available():
        raw = await llm.complete_json(
            read_prompt("middleman_report.md"),
            "TASK:middleman_report\n"
            f"INNOWACJA: {innovation.get('title')} — {innovation.get('summary')}\n"
            f"GMINA: {req.gmina.name}, typ {req.gmina.type}, mieszkańców {req.gmina.population}, trend {req.gmina.population_trend}\n"
            f"HISTORIA: {_history(req.history)}\n"
            f"CHECKLISTA: {items}",
            temperature=0.4,
        )
        try:
            parsed = MiddlemanReportResponse.model_validate(raw)
        except ValidationError as exc:
            raise LlmError() from exc
        summary = parsed.report.summary
        if "szacunek orientacyjny" not in summary.lower():
            summary = summary.rstrip(".") + ". Koszt poniżej to szacunek orientacyjny."
        checklist = parsed.report.usluga_wrazliwa_checklist or _mark_checklist(items, summary)
        report_body = parsed.report.model_copy(update={"summary": summary, "usluga_wrazliwa_checklist": checklist})
        return MiddlemanReportResponse(report=report_body)
    costs = _scale_costs(req.gmina.population)
    summary = (
        f"W {req.gmina.name} proponujemy oprzeć usługę na pomyśle „{innovation.get('title')}”. "
        "Koszt poniżej to szacunek orientacyjny, nie wycena."
    )
    body = ServiceReport(
        service_name=str(innovation.get("title") or "Usługa sąsiedzka"),
        summary=summary,
        root_causes=[
            "Brak codziennego kontaktu i wyjazdy młodszych mieszkańców.",
            "Trudny dojazd do lekarza i urzędu z dalszych miejscowości.",
        ],
        service_description=str(innovation.get("summary") or "Lokalna usługa prowadzona blisko domu."),
        delivery_partners=["gmina", "OPS", "organizacja społeczna", "świetlica wiejska"],
        staffing="Jedna osoba koordynująca na część etatu i kilku wolontariuszy. To założenie, dopóki gmina nie poda etatów.",
        cost_estimate=costs,
        kpis=["Liczba osób, które skorzystały w ciągu roku", "Liczba dojazdów do lekarza", "Liczba osób, które przyszły na spotkanie"],
        risks=["Za mało wolontariuszy w sezonie prac polowych", "Brak stałego finansowania po pilotażu"],
        usluga_wrazliwa_checklist=_mark_checklist(items, summary + " cel grupa partnerzy budżet wskaźniki trwałość"),
    )
    return MiddlemanReportResponse(report=body)


def _history(history) -> str:
    if not history:
        return "brak"
    return " | ".join(f"{message.role}: {message.content}" for message in history[-8:])
