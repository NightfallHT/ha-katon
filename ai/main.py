"""FastAPI routes only. Response shapes follow AGENTS.md section 6."""

from __future__ import annotations

import logging
import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

load_dotenv()

from llm import LlmError
from models import (
    ChatRequest,
    ChatResponse,
    EnrichRequest,
    EnrichResponse,
    GrantDraftRequest,
    GrantDraftResponse,
    HealthResponse,
    KreatorAssistRequest,
    KreatorAssistResponse,
    MatchRequest,
    MatchResponse,
    MiddlemanChatRequest,
    MiddlemanChatResponse,
    MiddlemanReportRequest,
    MiddlemanReportResponse,
    ReembedResponse,
    SimplifyRequest,
    SimplifyResponse,
)
from services.admin import enrich, reembed
from services.chat import chat
from services.kreator import assist, grant_draft
from services.match import match
from services.middleman import chat as middleman_chat
from services.middleman import report as middleman_report
from services.simplify import simplify

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("ai")

app = FastAPI(title="Hub Innowacji Społecznych — AI")


def _origins() -> list[str]:
    raw = os.getenv("ALLOWED_ORIGINS", "*").strip()
    if not raw or raw == "*":
        return ["*"]
    return [item.strip() for item in raw.split(",") if item.strip()]


app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins(),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(LlmError)
async def llm_error(_request, exc: LlmError):
    return JSONResponse(status_code=503, content={"error": exc.message})


@app.exception_handler(HTTPException)
async def http_error(_request, exc: HTTPException):
    message = exc.detail if isinstance(exc.detail, str) else "Wystąpił błąd."
    return JSONResponse(status_code=exc.status_code, content={"error": message})


@app.exception_handler(RequestValidationError)
async def validation_error(_request, _exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"error": "Niepoprawne dane wejściowe. Sprawdź formularz i spróbuj ponownie."},
    )


@app.exception_handler(Exception)
async def unhandled(_request, exc: Exception):
    log.error("unhandled %s", type(exc).__name__)
    return JSONResponse(status_code=500, content={"error": "Coś poszło nie tak. Spróbuj ponownie za chwilę."})


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(ok=True)


@app.post("/match", response_model=MatchResponse)
async def match_route(body: MatchRequest):
    if not body.query.strip():
        raise HTTPException(status_code=400, detail="Wpisz, czego szukasz — na przykład problem, który chcesz rozwiązać.")
    return await match(body)


@app.post("/simplify", response_model=SimplifyResponse)
async def simplify_route(body: SimplifyRequest):
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="Wklej tekst, który mam uprościć.")
    return await simplify(body)


@app.post("/kreator/assist", response_model=KreatorAssistResponse)
async def assist_route(body: KreatorAssistRequest):
    if not body.message.strip():
        raise HTTPException(status_code=400, detail="Napisz, w czym mam pomóc przy tym pomyśle.")
    return await assist(body)


@app.post("/kreator/grant-draft", response_model=GrantDraftResponse)
async def grant_route(body: GrantDraftRequest):
    return await grant_draft(body)


@app.post("/middleman/chat", response_model=MiddlemanChatResponse)
async def middleman_chat_route(body: MiddlemanChatRequest):
    if not body.message.strip():
        raise HTTPException(status_code=400, detail="Napisz, czego potrzebuje gmina.")
    return await middleman_chat(body)


@app.post("/middleman/report", response_model=MiddlemanReportResponse)
async def middleman_report_route(body: MiddlemanReportRequest):
    return await middleman_report(body)


@app.post("/chat", response_model=ChatResponse)
async def chat_route(body: ChatRequest):
    if not body.message.strip():
        raise HTTPException(status_code=400, detail="Napisz pytanie o platformę albo o innowacje.")
    return await chat(body)


@app.post("/admin/enrich", response_model=EnrichResponse)
async def enrich_route(body: EnrichRequest):
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="Brakuje tekstu zgłoszenia do skrócenia.")
    return await enrich(body)


@app.post("/admin/reembed", response_model=ReembedResponse)
async def reembed_route():
    return await reembed()
