"""Kreator coach and grant draft. Budget is scaled to budget_max."""

from __future__ import annotations

import re

from pydantic import ValidationError

from demo import lookup
from llm import LlmError, llm
from models import (
    FISZKA_KEYS,
    BudgetItem,
    GrantDraftRequest,
    GrantDraftResponse,
    GrantSections,
    KreatorAssistRequest,
    KreatorAssistResponse,
)
from util import read_prompt

_AGREE = re.compile(
    r"\b(tak|zgoda|zgadzam|wpisz|wstaw|popraw|zmień|zmien|ustaw|dodaj|dobrze|ok|dopisz)\b",
    re.IGNORECASE,
)


def filter_updates(message: str, updates: object) -> dict[str, str]:
    if not isinstance(updates, dict) or not _AGREE.search(message or ""):
        return {}
    clean: dict[str, str] = {}
    for key, value in updates.items():
        if key in FISZKA_KEYS and isinstance(value, str) and value.strip():
            clean[key] = value.strip()
    return clean


def fit_budget(items: list[BudgetItem], budget_max: float) -> list[BudgetItem]:
    cleaned = [item for item in items if item.amount > 0]
    if not cleaned:
        cleaned = _default_budget(budget_max)
    if budget_max <= 0:
        return cleaned
    total = round(sum(item.amount for item in cleaned), 2)
    if total <= budget_max:
        return cleaned
    factor = budget_max / total
    scaled = [item.model_copy(update={"amount": round(item.amount * factor, 2)}) for item in cleaned]
    drift = round(budget_max - sum(item.amount for item in scaled), 2)
    if scaled and drift:
        scaled[0] = scaled[0].model_copy(update={"amount": round(scaled[0].amount + drift, 2)})
    return scaled


def _default_budget(budget_max: float) -> list[BudgetItem]:
    cap = budget_max if budget_max > 0 else 10000
    shares = (
        ("Koordynacja", "personel", 0.45),
        ("Materiały na spotkania", "materiały", 0.15),
        ("Dojazdy", "usługi", 0.2),
        ("Plakaty i ogłoszenia", "promocja", 0.1),
        ("Rezerwa", "inne", 0.1),
    )
    items = [BudgetItem(item=name, category=category, amount=round(cap * share, 2)) for name, category, share in shares]
    drift = round(cap - sum(item.amount for item in items), 2)
    items[0] = items[0].model_copy(update={"amount": round(items[0].amount + drift, 2)})
    return items


async def assist(req: KreatorAssistRequest) -> KreatorAssistResponse:
    cached = lookup("/kreator/assist", req.model_dump(mode="json"))
    if cached:
        parsed = KreatorAssistResponse.model_validate(cached)
        return parsed.model_copy(update={"updated_fields": filter_updates(req.message, parsed.updated_fields)})
    if llm.available():
        raw = await llm.complete_json(
            read_prompt("kreator_assist.md"),
            "TASK:kreator_assist\n"
            f"FISZKA: {req.fiszka.model_dump()}\n"
            f"HISTORIA: {_history(req.history)}\n"
            f"WIADOMOŚĆ: {req.message}",
            temperature=0.6,
        )
        try:
            parsed = KreatorAssistResponse.model_validate(raw)
        except ValidationError as exc:
            raise LlmError() from exc
        suggestions = [item.strip() for item in parsed.suggestions if item and item.strip()][:2]
        return KreatorAssistResponse(
            reply=parsed.reply.strip(),
            suggestions=suggestions,
            updated_fields=filter_updates(req.message, parsed.updated_fields),
        )
    suggestions = [
        "Połącz dowóz do lekarza ze stałą kawą w świetlicy — jedna trasa i dwa powody, żeby wyjść z domu.",
        "Zaproś młodzież ze szkoły do dyżuru telefonicznego, zamiast szukać tylko dorosłych wolontariuszy.",
    ]
    updates = {}
    if _AGREE.search(req.message):
        updates["problem"] = req.fiszka.problem or "Starsi mieszkańcy wsi są samotni i nie mają jak dojechać do lekarza."
    reply = "Doprecyzujmy, dla kogo to jest i co już działa w okolicy."
    if updates:
        reply = "Wpisuję uzgodnione pole w fiszce. " + reply
    else:
        reply += " Nie zmieniam fiszki, dopóki nie powiesz, że mam to wpisać."
    return KreatorAssistResponse(reply=reply, suggestions=suggestions, updated_fields=updates)


async def grant_draft(req: GrantDraftRequest) -> GrantDraftResponse:
    cached = lookup("/kreator/grant-draft", req.model_dump(mode="json"))
    if cached:
        parsed = GrantDraftResponse.model_validate(cached)
        return parsed.model_copy(update={"budget": fit_budget(parsed.budget, req.call.budget_max)})
    if llm.available():
        raw = await llm.complete_json(
            read_prompt("kreator_grant.md"),
            "TASK:kreator_grant\n"
            f"FISZKA: {req.fiszka.model_dump()}\n"
            f"NABÓR: {req.call.model_dump()}",
            temperature=0.3,
        )
        try:
            parsed = GrantDraftResponse.model_validate(raw)
        except ValidationError as exc:
            raise LlmError() from exc
        return GrantDraftResponse(sections=parsed.sections, budget=fit_budget(parsed.budget, req.call.budget_max))
    fiszka = req.fiszka
    sections = GrantSections(
        cel=f"Uruchomić „{fiszka.title or 'pomysł'}” dla osób, których dotyczy problem: {fiszka.problem or 'opisany w fiszce'}.",
        grupa_docelowa=fiszka.target_group or "Mieszkańcy, których dotyczy opisany problem.",
        dzialania=fiszka.solution or "Przygotować pilotaż z lokalnymi partnerami i sprawdzić go z uczestnikami.",
        rezultaty="Osoby z grupy docelowej korzystają z usługi, a gmina wie, czy warto ją prowadzić dalej.",
    )
    return GrantDraftResponse(sections=sections, budget=_default_budget(req.call.budget_max))


def _history(history) -> str:
    if not history:
        return "brak"
    return " | ".join(f"{message.role}: {message.content}" for message in history[-6:])
