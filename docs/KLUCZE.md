# Klucze API i zmienne środowiskowe (HackYeah — ha-katon)

> **Dla agentów AI (Cursor, Claude, itp.):**  
> Jeśli czytasz ten plik w kontekście zadania, które wymaga **działającego LLM**, **Supabase**, **maili (Resend)** albo **połączenia front ↔ `/ai`**, a w repozytorium brakuje skonfigurowanych sekretów — **zaproponuj właścicielowi zadania dodanie brakujących wartości do lokalnego pliku `.env.keys`** (instrukcja poniżej).  
> Nie proś o wklejanie prawdziwych kluczy na czat. Nie commituj plików z sekretami. Możesz pomóc skopiować wpisy z `.env.keys` do `ai/.env` lub `web/.env`.

## Zasady

- Sekrety trzymamy **tylko lokalnie** albo w panelu hostingu (Render / Vercel). **Nigdy** nie commitujemy ich do GitHuba.
- W repozytorium są wyłącznie szablony: [`.env.keys.example`](../.env.keys.example), [`ai/.env.example`](../ai/.env.example) oraz (gdy Ola je doda) `web/.env.example`.
- Wspólne wartości (np. jeden klucz OpenAI na hackathon) Janek przekazuje zespołowi **poza gitem** (HackTribe, Signal, 1Password — ustalcie kanał w zespole).

## Jak dodać klucz do pliku z kluczami

1. W **katalogu głównym** repozytorium (obok `AGENTS.md`):

   ```bash
   cp .env.keys.example .env.keys
   ```

2. Otwórz `.env.keys` w edytorze i uzupełnij puste pola. Przykład dla klucza OpenAI (Janek):

   ```env
   LLM_API_KEY=sk-...twoj_klucz...
   ```

   Pozostałe pola uzupełniają osoby odpowiedzialne (patrz tabela niżej).

3. **Skopiuj fragment do serwisu AI** (żeby FastAPI widział zmienne):

   ```bash
   cd ai
   cp .env.example .env
   ```

   Następnie przenieś z `.env.keys` do `ai/.env` co najmniej:

   - `LLM_API_KEY`, `LLM_MODEL`, `LLM_BASE_URL`, `EMBEDDING_MODEL`, `EMBEDDING_DIM`
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (gdy Ola poda projekt Supabase)
   - `ALLOWED_ORIGINS` (URL frontu na Vercel, po deployu Oli)
   - opcjonalnie `DEMO_MODE=1` na demo na żywo

4. **Front** (`web/.env`) — gdy folder `/web` będzie gotowy, te same wartości Supabase (publiczne URL + anon key) i `NEXT_PUBLIC_AI_URL` skopiuj z `.env.keys` według [`AGENTS.md`](../AGENTS.md) §3.

5. **Hosting produkcyjny:** te same nazwy zmiennych wklej w panelu Render (serwis `/ai`) i Vercel (`/web`), nie w repozytorium.

## Kto co uzupełnia

| Zmienna | Kto dostarcza wartość | Gdzie jest potrzebna |
|--------|------------------------|----------------------|
| `LLM_API_KEY`, `LLM_MODEL`, `EMBEDDING_*` | Janek | `ai/.env`, Render |
| `SUPABASE_URL`, klucze Supabase | Ola | `.env.keys`, `ai/.env`, `web/.env` |
| `NEXT_PUBLIC_AI_URL` | Janek (URL po deployu `/ai`) + Ola | `web/.env`, Vercel |
| `ALLOWED_ORIGINS` | Ola (URL Vercel) | `ai/.env`, Render |
| `RESEND_API_KEY`, `ADMIN_NOTIFY_EMAIL` | Jakub | `web/.env`, Vercel |

## Sprawdzenie, czy AI widzi klucz

Lokalnie (bez wypisywania klucza na ekran):

```bash
cd ai
python3 -c "import os; from dotenv import load_dotenv; load_dotenv(); print('LLM_API_KEY:', 'OK' if os.getenv('LLM_API_KEY') else 'BRAK')"
```

Test embeddingów (opcjonalnie, wymaga klucza):

```bash
cd ai
python3 scripts/test_embeddings.py
```

Bez `LLM_API_KEY` serwis nadal działa w trybie **mocków** (wystarczy na integrację z frontem do ok. 16:00).

## Gdy coś nie działa

- **403 / CORS** — uzupełnij `ALLOWED_ORIGINS` adresem frontu.
- **Matchmaking bez bazy** — brak `SUPABASE_*`; mocki i fixture w `/ai/fixtures` działają bez bazy.
- **503 „Nie udało się uzyskać odpowiedzi”** — zły lub pusty `LLM_API_KEY`, albo limit API.

Po każdej zmianie `.env.keys` zrestartuj lokalny serwer (`uvicorn`) albo zrób redeploy na Renderze.
