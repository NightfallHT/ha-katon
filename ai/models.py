"""Pydantic models mirroring AGENTS.md section 6. Do not change shapes without Ola."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator

CATEGORIES = (
    "starzenie",
    "zdrowie_psychiczne",
    "samotnosc",
    "wykluczenie_cyfrowe",
    "dostep_do_uslug",
    "niepelnosprawnosc",
    "integracja_spoleczna",
    "rodzina_dzieci",
    "wspolpraca_miedzysektorowa",
    "inne",
)

BUDGET_CATEGORIES = ("personel", "materiały", "usługi", "promocja", "inne")

FISZKA_KEYS = ("title", "problem", "solution", "target_group", "stage")

# Polish labels the model might return instead of slugs.
_LABELS = {
    "starzenie": "starzenie",
    "starzenie sie": "starzenie",
    "seniorzy": "starzenie",
    "zdrowie psychiczne": "zdrowie_psychiczne",
    "samotnosc": "samotnosc",
    "samotność": "samotnosc",
    "wykluczenie cyfrowe": "wykluczenie_cyfrowe",
    "dostep do uslug": "dostep_do_uslug",
    "dostęp do usług": "dostep_do_uslug",
    "transport": "dostep_do_uslug",
    "niepelnosprawnosc": "niepelnosprawnosc",
    "niepełnosprawność": "niepelnosprawnosc",
    "integracja spoleczna": "integracja_spoleczna",
    "integracja społeczna": "integracja_spoleczna",
    "rodzina": "rodzina_dzieci",
    "rodzina i dzieci": "rodzina_dzieci",
    "wspolpraca miedzysektorowa": "wspolpraca_miedzysektorowa",
    "współpraca międzysektorowa": "wspolpraca_miedzysektorowa",
    "inne": "inne",
}


def _fold(value: str) -> str:
    table = str.maketrans("ąćęłńóśźżĄĆĘŁŃÓŚŹŻ", "acelnoszzACELNOSZZ")
    return " ".join(value.strip().lower().translate(table).replace("-", " ").split())


def coerce_category(value: object) -> str:
    if not isinstance(value, str) or not value.strip():
        return "inne"
    folded = _fold(value)
    slug = folded.replace(" ", "_")
    if slug in CATEGORIES:
        return slug
    if folded in _LABELS:
        return _LABELS[folded]
    return "inne"


def coerce_budget_category(value: object) -> str:
    if not isinstance(value, str):
        return "inne"
    folded = _fold(value)
    for item in BUDGET_CATEGORIES:
        if _fold(item) == folded:
            return item
    return "inne"


class HistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class Extracted(BaseModel):
    category: str
    target_group: str
    location: str | None = None
    keywords: list[str] = Field(default_factory=list)

    @field_validator("category", mode="before")
    @classmethod
    def _category(cls, value: object) -> str:
        return coerce_category(value)


class MatchResult(BaseModel):
    innovation_id: str
    title: str
    summary: str
    category: str
    score: float
    why: str

    @field_validator("category", mode="before")
    @classmethod
    def _category(cls, value: object) -> str:
        return coerce_category(value)


class SimilarNeeds(BaseModel):
    count: int
    example: str | None = None


class MatchRequest(BaseModel):
    query: str
    location: str | None = None
    role: str | None = None


class MatchResponse(BaseModel):
    need_id: str
    extracted: Extracted
    results: list[MatchResult]
    similar_needs: SimilarNeeds


class SimplifyRequest(BaseModel):
    text: str


class SimplifyResponse(BaseModel):
    text: str


class Fiszka(BaseModel):
    title: str = ""
    problem: str = ""
    solution: str = ""
    target_group: str = ""
    stage: str = ""


class KreatorAssistRequest(BaseModel):
    fiszka: Fiszka
    message: str
    history: list[HistoryMessage] = Field(default_factory=list)


class KreatorAssistResponse(BaseModel):
    reply: str
    suggestions: list[str] = Field(default_factory=list)
    updated_fields: dict[str, str] = Field(default_factory=dict)


class CallInfo(BaseModel):
    name: str
    budget_max: float
    description: str = ""


class BudgetItem(BaseModel):
    item: str
    category: str
    amount: float

    @field_validator("category", mode="before")
    @classmethod
    def _category(cls, value: object) -> str:
        return coerce_budget_category(value)

    @field_validator("amount", mode="before")
    @classmethod
    def _amount(cls, value: object) -> float:
        try:
            return round(float(value), 2)
        except (TypeError, ValueError):
            return 0.0


class GrantSections(BaseModel):
    cel: str
    grupa_docelowa: str
    dzialania: str
    rezultaty: str


class GrantDraftRequest(BaseModel):
    fiszka: Fiszka
    call: CallInfo


class GrantDraftResponse(BaseModel):
    sections: GrantSections
    budget: list[BudgetItem]


class Gmina(BaseModel):
    name: str
    type: str
    population: int
    population_trend: str


class MiddlemanChatRequest(BaseModel):
    innovation_id: str
    gmina: Gmina
    history: list[HistoryMessage] = Field(default_factory=list)
    message: str


class MiddlemanChatResponse(BaseModel):
    reply: str
    done: bool


class CostItem(BaseModel):
    item: str
    amount_pln_per_year: float

    @field_validator("amount_pln_per_year", mode="before")
    @classmethod
    def _amount(cls, value: object) -> float:
        try:
            return round(float(value), 2)
        except (TypeError, ValueError):
            return 0.0


class ChecklistItem(BaseModel):
    item: str
    done: bool


class ServiceReport(BaseModel):
    service_name: str
    summary: str
    root_causes: list[str]
    service_description: str
    delivery_partners: list[str]
    staffing: str
    cost_estimate: list[CostItem]
    kpis: list[str]
    risks: list[str]
    usluga_wrazliwa_checklist: list[ChecklistItem]


class MiddlemanReportRequest(BaseModel):
    innovation_id: str
    gmina: Gmina
    history: list[HistoryMessage] = Field(default_factory=list)


class MiddlemanReportResponse(BaseModel):
    report: ServiceReport


class ChatRequest(BaseModel):
    message: str
    history: list[HistoryMessage] = Field(default_factory=list)
    page: str | None = None


class Source(BaseModel):
    title: str
    url: str


class ChatResponse(BaseModel):
    reply: str
    sources: list[Source] = Field(default_factory=list)
    handoff: bool


class EnrichRequest(BaseModel):
    text: str


class EnrichResponse(BaseModel):
    summary: str
    tags: list[str]
    category: str

    @field_validator("category", mode="before")
    @classmethod
    def _category(cls, value: object) -> str:
        return coerce_category(value)


class ReembedResponse(BaseModel):
    updated: int


class HealthResponse(BaseModel):
    ok: bool = True
