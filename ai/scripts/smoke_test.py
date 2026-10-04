"""Smoke checks for every contract endpoint. No network and no API key required."""

from __future__ import annotations

import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
os.environ["DEMO_MODE"] = "0"
os.environ["LLM_API_KEY"] = ""
os.environ.pop("SUPABASE_URL", None)
os.environ.pop("SUPABASE_SERVICE_ROLE_KEY", None)

from fastapi.testclient import TestClient

from llm import LlmError, llm
from main import app
from models import CATEGORIES
from services.kreator import fit_budget
from services.middleman import checklist_items
from models import BudgetItem

HALINA = "Starsi sąsiedzi są samotni i nie mogą dojechać do lekarza. Mieszkam w wiejskiej gminie."
HALINA_DEMO = "Słabo widzę. Chcę wiedzieć, z jakich innowacji w Małopolsce mogę skorzystać. Pokaż mi to, co jest dla osób takich jak ja."
GMINA = {"name": "Gmina Testowa", "type": "wiejska", "population": 4200, "population_trend": "spada"}
FISZKA = {
    "title": "Dowóz do lekarza",
    "problem": "Seniorzy na wsi są samotni i nie mają transportu.",
    "solution": "Wolontariusze wożą ich do przychodni.",
    "target_group": "seniorzy",
    "stage": "pomysł",
}

client = TestClient(app)
llm.api_key = ""


def check(condition: bool, label: str) -> None:
    if not condition:
        raise SystemExit(f"FAIL {label}")
    print(f"PASS {label}")


def test_health_and_cors() -> None:
    response = client.get("/health", headers={"Origin": "https://hub.vercel.app"})
    check(response.status_code == 200 and response.json() == {"ok": True}, "health")
    check(response.headers.get("access-control-allow-origin") == "*", "cors")


def test_errors() -> None:
    empty = client.post("/match", json={"query": "  "})
    check(empty.status_code == 400 and "error" in empty.json(), "empty match")
    invalid = client.post("/match", json={})
    check(invalid.status_code == 422 and "error" in invalid.json(), "invalid match")


def test_match() -> None:
    response = client.post("/match", json={"query": HALINA, "location": "gmina wiejska", "role": "mieszkaniec"})
    body = response.json()
    check(response.status_code == 200, "match status")
    check(3 <= len(body["results"]) <= 5, "match count")
    check(body["results"][0]["score"] >= 0.5, "halina confident")
    vision = client.post("/match", json={"query": HALINA_DEMO})
    vision_body = vision.json()
    check(vision.status_code == 200 and vision_body["extracted"]["category"] == "niepelnosprawnosc", "vision category")
    check(vision_body["results"][0]["score"] >= 0.5, "vision confident")
    check(all(item["why"] and item["category"] in CATEGORIES for item in body["results"]), "match shape")
    weak = client.post("/match", json={"query": "zzzz qqqq"})
    check(weak.status_code == 200 and weak.json()["results"][0]["score"] < 0.5, "low confidence")


def test_simplify_enrich_reembed() -> None:
    text = (
        "Innowacja społeczna polegająca na organizacji sąsiedzkiego transportu dla osób starszych, "
        "które z powodu braku komunikacji publicznej nie są w stanie samodzielnie dotrzeć do placówek "
        "ochrony zdrowia, co pogłębia ich izolację i pogarsza stan zdrowia."
    )
    simplified = client.post("/simplify", json={"text": text})
    words = simplified.json()["text"].split()
    check(simplified.status_code == 200 and 0 < len(words) <= 80, "simplify length")
    enriched = client.post(
        "/admin/enrich",
        json={"text": "Mieszkańcy wsi w wieku senioralnym są samotni, bo nie mają transportu do lekarza."},
    )
    payload = enriched.json()
    check(enriched.status_code == 200 and payload["category"] in CATEGORIES, "enrich category")
    check(3 <= len(payload["tags"]) <= 6 and payload["summary"], "enrich tags")
    reembed = client.post("/admin/reembed")
    check(reembed.status_code == 200 and reembed.json() == {"updated": 0}, "reembed without db")


def test_middleman() -> None:
    first = client.post(
        "/middleman/chat",
        json={"innovation_id": "a1000001-0000-4000-8000-000000000001", "gmina": GMINA, "history": [], "message": "Chcemy pomóc seniorom."},
    )
    reply = first.json()
    check(first.status_code == 200 and reply["done"] is False and reply["reply"].count("?") == 1, "one question")
    history = [{"role": "user", "content": f"odpowiedź {index}"} for index in range(4)]
    done = client.post(
        "/middleman/chat",
        json={
            "innovation_id": "a1000001-0000-4000-8000-000000000001",
            "gmina": GMINA,
            "history": history,
            "message": "Budżet jest mały.",
        },
    )
    check(done.json()["done"] is True, "done after four questions")
    report = client.post(
        "/middleman/report",
        json={"innovation_id": "a1000001-0000-4000-8000-000000000001", "gmina": GMINA, "history": history},
    )
    body = report.json()["report"]
    check("szacunek orientacyjny" in body["summary"].lower(), "cost label")
    check(len(body["usluga_wrazliwa_checklist"]) >= 3, "generic checklist")
    items = checklist_items()
    check(any("świadczenia" in item.lower() or "swiadczenia" in item.lower() for item in items), "checklist source")


def test_kreator_and_chat() -> None:
    assist = client.post(
        "/kreator/assist",
        json={"fiszka": FISZKA, "message": "Od czego zacząć?", "history": []},
    )
    body = assist.json()
    check(assist.status_code == 200 and body["updated_fields"] == {} and len(body["suggestions"]) == 2, "assist waits")
    agreed = client.post(
        "/kreator/assist",
        json={"fiszka": FISZKA, "message": "Tak, wpisz to.", "history": []},
    )
    check("problem" in agreed.json()["updated_fields"], "assist agrees")
    draft = client.post(
        "/kreator/grant-draft",
        json={"fiszka": FISZKA, "call": {"name": "Nabór testowy", "budget_max": 15000, "description": "Małe granty"}},
    )
    amounts = [item["amount"] for item in draft.json()["budget"]]
    check(abs(sum(amounts) - 15000) < 0.02, "budget sum")
    huge = fit_budget([BudgetItem(item="Etaty", category="personel", amount=999999)], 20000)
    check(abs(sum(item.amount for item in huge) - 20000) < 0.02, "budget scale")
    chat = client.post("/chat", json={"message": "Jak działa kreator pomysłów?", "history": [], "page": "/kreator"})
    check(chat.status_code == 200 and chat.json()["handoff"] is False and chat.json()["sources"], "chat sources")
    person = client.post("/chat", json={"message": "Chcę rozmawiać z człowiekiem.", "history": []})
    check(person.json()["handoff"] is True, "chat handoff")
    grant = client.post("/chat", json={"message": "Czy mogę przygotować wniosek o grant?", "history": []})
    check(grant.json()["handoff"] is False and grant.json()["sources"][0]["url"] == "/kreator", "faq grant")
    institution = client.post("/chat", json={"message": "Czym jest Middleman Innowacji?", "history": []})
    check("gmin" in institution.json()["reply"].lower() and institution.json()["sources"][0]["url"] == "/middleman", "faq middleman")


def test_demo_cache() -> None:
    os.environ["DEMO_MODE"] = "1"
    cached = client.post("/match", json={"query": HALINA_DEMO})
    cached_body = cached.json()
    check(cached_body["need_id"] == "22222222-2222-4222-8222-222222222201", "demo cache")
    check(cached_body["results"][0]["title"] == "Zdobądź swoje szczyty", "demo vision title")
    check(cached_body["results"][0]["innovation_id"] != "seed", "demo id bound")
    report = client.post(
        "/middleman/report",
        json={
            "innovation_id": "a1000001-0000-4000-8000-000000000001",
            "gmina": {"name": "Gmina Zielony Brzeg", "type": "wiejska", "population": 4200, "population_trend": "spada"},
            "history": [],
        },
    )
    check(report.json()["report"]["service_name"] == "Sąsiedzki dowóz do lekarza", "demo report")
    os.environ["DEMO_MODE"] = "0"


def test_live_paths() -> None:
    os.environ["DEMO_MODE"] = "0"

    async def fake_complete(system: str, user: str, temperature: float = 0.2) -> dict:
        if "TASK:match_extract" in user:
            return {
                "category": "samotnosc",
                "target_group": "seniorzy",
                "location": "gmina wiejska",
                "keywords": ["samotność", "lekarz"],
            }
        if "TASK:match_rerank" in user:
            ids = re.findall(r"[0-9a-f-]{36}", user)
            return {
                "low_confidence": False,
                "items": [{"innovation_id": item, "why": "To pasuje, bo piszesz o samotności i lekarzu."} for item in ids[:4]],
            }
        if "TASK:simplify" in user:
            return {"text": "Sąsiedzi podwożą starsze osoby do lekarza. We wsi nie ma autobusu."}
        if "TASK:enrich" in user:
            return {"summary": "Seniorzy nie mają dojazdu.", "tags": ["seniorzy", "transport", "wieś"], "category": "samotność"}
        if "TASK:middleman_chat" in user:
            return {"reply": "Kto dokładnie tego potrzebuje? Czy OPS już pomaga?", "done": False}
        if "TASK:middleman_report" in user:
            return {
                "report": {
                    "service_name": "Dowóz",
                    "summary": "Krótki szkic.",
                    "root_causes": ["Brak autobusu"],
                    "service_description": "Dowóz raz w tygodniu.",
                    "delivery_partners": ["OPS"],
                    "staffing": "Część etatu.",
                    "cost_estimate": [{"item": "Koordynacja", "amount_pln_per_year": 1000}],
                    "kpis": ["Liczba dojazdów"],
                    "risks": ["Mało wolontariuszy"],
                    "usluga_wrazliwa_checklist": [{"item": "Cel", "done": True}],
                }
            }
        if "TASK:kreator_assist" in user:
            return {
                "reply": "Wpisuję problem.",
                "suggestions": ["Kawa po wizycie", "Dyżur młodzieży"],
                "updated_fields": {"problem": "Samotni seniorzy bez dojazdu.", "secret": "nie"},
            }
        if "TASK:kreator_grant" in user:
            return {
                "sections": {"cel": "Cel", "grupa_docelowa": "Seniorzy", "dzialania": "Pilotaż", "rezultaty": "Dojazdy"},
                "budget": [{"item": "Etaty", "category": "wynagrodzenia", "amount": 999999}],
            }
        if "TASK:chat" in user:
            return {
                "reply": "Wejdź w kreator. To pierwsza wskazówka. Druga. Trzecia. Czwarta. Piąta. Szósta. Siódma.",
                "sources": [{"title": "Kreator", "url": "/kreator"}, {"title": "Obce", "url": "https://evil.example"}],
                "handoff": False,
            }
        raise LlmError()

    old_available = llm.available
    old_complete = llm.complete_json
    llm.available = lambda: True
    llm.complete_json = fake_complete
    try:
        matched = client.post("/match", json={"query": HALINA})
        check("samotności" in matched.json()["results"][0]["why"], "live rerank")
        simple = client.post("/simplify", json={"text": "Długi tekst o transporcie seniorów na wieś i z powrotem."})
        check("autobusu" in simple.json()["text"], "live simplify")
        enriched = client.post("/admin/enrich", json={"text": "Seniorzy na wsi nie dojadą do lekarza i są samotni."})
        check(enriched.json()["category"] == "samotnosc", "live enrich slug")
        asked = client.post(
            "/middleman/chat",
            json={"innovation_id": "a1000001-0000-4000-8000-000000000001", "gmina": GMINA, "history": [], "message": "Start"},
        )
        check(asked.json()["reply"].count("?") == 1, "live one question")
        drafted = client.post(
            "/middleman/report",
            json={"innovation_id": "a1000001-0000-4000-8000-000000000001", "gmina": GMINA, "history": []},
        )
        check("szacunek orientacyjny" in drafted.json()["report"]["summary"].lower(), "live report label")
        helped = client.post("/kreator/assist", json={"fiszka": FISZKA, "message": "Tak, wpisz.", "history": []})
        check(helped.json()["updated_fields"] == {"problem": "Samotni seniorzy bez dojazdu."}, "live fields")
        blocked = client.post("/kreator/assist", json={"fiszka": FISZKA, "message": "Jeszcze nie.", "history": []})
        check(blocked.json()["updated_fields"] == {}, "live no agree")
        grant = client.post(
            "/kreator/grant-draft",
            json={"fiszka": FISZKA, "call": {"name": "Nabór", "budget_max": 20000, "description": ""}},
        )
        check(abs(sum(item["amount"] for item in grant.json()["budget"]) - 20000) < 0.02, "live budget cap")
        check(grant.json()["budget"][0]["category"] == "inne", "unknown budget category")
        bot = client.post("/chat", json={"message": "Gdzie jest kreator?", "history": []})
        sentences = [part for part in re.split(r"(?<=[.!?])\s+", bot.json()["reply"]) if part]
        check(len(sentences) <= 5 and bot.json()["sources"] == [{"title": "Kreator", "url": "/kreator"}], "live chat trim")
        llm.complete_json = lambda *args, **kwargs: (_ for _ in ()).throw(LlmError())
        failed = client.post("/simplify", json={"text": "cokolwiek dłuższego tutaj"})
        check(failed.status_code == 503 and "error" in failed.json(), "polish llm error")
    finally:
        llm.available = old_available
        llm.complete_json = old_complete


if __name__ == "__main__":
    test_health_and_cors()
    test_errors()
    test_match()
    test_simplify_enrich_reembed()
    test_middleman()
    test_kreator_and_chat()
    test_demo_cache()
    test_live_paths()
    print("ALL PASS")
