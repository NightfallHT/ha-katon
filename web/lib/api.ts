import type {
  ChatResponse,
  ChatTurn,
  EnrichResponse,
  Fiszka,
  GrantDraftResponse,
  KnowledgeReport,
  KreatorAssistResponse,
  MatchResponse,
  MiddlemanChatResponse,
  MiddlemanReport,
  SimplifyResponse,
} from "./types";
import { localKnowledgeReport } from "./local-knowledge";
import { localMatch } from "./local-match";

const TIMEOUT_MS = 30_000;
const POLISH_TIMEOUT = "Serwis odpowiedzi działa wolno. Spróbuj ponownie za chwilę.";

function baseUrl() {
  return (process.env.NEXT_PUBLIC_AI_URL ?? "").replace(/\/$/, "");
}

class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, body?: unknown): Promise<T> {
  const root = baseUrl();
  if (!root) {
    throw new ApiError("Brak adresu serwisu AI. Ustaw NEXT_PUBLIC_AI_URL.");
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${root}${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    const data = (await response.json().catch(() => null)) as
      | T
      | { error?: string }
      | null;
    if (!response.ok) {
      const message =
        data && typeof data === "object" && "error" in data && data.error
          ? String(data.error)
          : "Nie udało się połączyć z serwisem. Spróbuj ponownie.";
      throw new ApiError(message);
    }
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError(POLISH_TIMEOUT);
    }
    throw new ApiError("Nie udało się połączyć z serwisem. Spróbuj ponownie.");
  } finally {
    clearTimeout(timer);
  }
}

export async function match(input: {
  query: string;
  location?: string;
  role?: string;
}): Promise<MatchResponse> {
  try {
    return await request<MatchResponse>("/match", input);
  } catch {
    return localMatch(input.query);
  }
}

export async function simplify(input: { text: string }): Promise<SimplifyResponse> {
  try {
    return await request<SimplifyResponse>("/simplify", input);
  } catch {
    return {
      text: input.text
        .replaceAll(", co ", ". To ")
        .replaceAll("; ", ". ")
        .slice(0, 280),
    };
  }
}

export function kreatorAssist(input: {
  fiszka: Fiszka;
  message: string;
  history: ChatTurn[];
}) {
  return request<KreatorAssistResponse>("/kreator/assist", input);
}

export function grantDraft(input: {
  fiszka: Fiszka;
  call: { name: string; budget_max: number; description: string };
}) {
  return request<GrantDraftResponse>("/kreator/grant-draft", input);
}

export function middlemanChat(input: {
  innovation_id: string;
  gmina: {
    name: string;
    type: string;
    population: number;
    population_trend: string;
  };
  history: ChatTurn[];
  message: string;
}) {
  return request<MiddlemanChatResponse>("/middleman/chat", input);
}

export function middlemanReport(input: {
  innovation_id: string;
  gmina: {
    name: string;
    type: string;
    population: number;
    population_trend: string;
  };
  history: ChatTurn[];
}): Promise<{ report: MiddlemanReport }> {
  return request("/middleman/report", input);
}

export function chat(input: { message: string; history: ChatTurn[]; page?: string }) {
  return request<ChatResponse>("/chat", input);
}

export async function knowledgeReport(input: {
  query: string;
  audience?: "person" | "institution";
}): Promise<KnowledgeReport> {
  try {
    return await request<KnowledgeReport>("/knowledge/report", input);
  } catch {
    return localKnowledgeReport(input.query, input.audience ?? "person");
  }
}

export function adminEnrich(input: { text: string }) {
  return request<EnrichResponse>("/admin/enrich", input);
}

export function adminReembed() {
  return request<{ updated: number }>("/admin/reembed");
}
