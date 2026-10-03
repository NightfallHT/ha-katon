# Klucze API i zmienne środowiskowe (HackYeah — ha-katon)

> **Dla agentów AI (Cursor, Claude, itp.):**  
> Jeśli czytasz ten plik w kontekście zadania, które wymaga **działającego LLM**, **Supabase**, **maili (Resend)** albo **połączenia front ↔ `/ai`**, a w repozytorium brakuje skonfigurowanych sekretów — **zaproponuj właścicielowi zadania dodanie brakujących wartości do lokalnego pliku `.env.keys`** (instrukcja poniżej).  
> Nie proś o wklejanie prawdziwych kluczy na czat. Nie commituj plików z sekretami. Możesz pomóc skopiować wpisy z `.env.keys` do `ai/.env` lub `web/.env`.

## Zasady

- Sekrety trzymamy **tylko lokalnie** albo w panelu hostingu (Render / Vercel). **Nigdy** nie commitujemy ich do GitHuba.
- W repozytorium są wyłącznie szablony: [`.env.keys.example`](../.env.keys.example), [`.env.example`](../.env.example) (pełna lista zmiennych), [`ai/.env.example`](../ai/.env.example).
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

4. **Front** (`web/.env.local`) — `/web` już stoi. Skopiuj z `.env.keys` publiczny `SUPABASE_URL`,
   klucz `sb_publishable_...` (patrz sekcja „Które klucze Supabase skopiować”) oraz
   `NEXT_PUBLIC_AI_URL`, według [`AGENTS.md`](../AGENTS.md) §3. Next.js czyta `.env.local`
   automatycznie; plik jest w `.gitignore`.

5. **Hosting produkcyjny:** te same nazwy zmiennych wklej w panelu Render (serwis `/ai`) i Vercel (`/web`), nie w repozytorium.

## Które klucze Supabase skopiować (ważne)

W panelu Supabase, w *Settings → API Keys*, są **dwie grupy**. Bierzemy **nowe** klucze — nie
zakładkę **Legacy API keys**. Supabase wyłącza stare `anon` / `service_role` (JWT) **do końca 2026**.

| Klucz w panelu | Wklej do zmiennej | Gdzie wolno go trzymać |
|---|---|---|
| `sb_publishable_...` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | przeglądarka, `web/.env.local`, Vercel |
| `sb_secret_...` | `SUPABASE_SERVICE_ROLE_KEY` | **tylko serwer**: `ai/.env`, Render, `.env` w katalogu głównym |

⚠ **Nazwy zmiennych zostały stare (`ANON`, `SERVICE_ROLE`), ale wartości są nowe.**
Tych nazw używają już `ai/db.py`, `ai/render.yaml` i ten plik, a `/ai` jest wdrożone — zmiana nazw
wymagałaby też zmiany zmiennej w panelu Render, czyli awarii bez żadnego zysku. Porządki po
hackathonie. **Stare nazwy, nowe wartości `sb_...`.**

Nowe klucze unieważnia się pojedynczo, więc kliknij *Create new secret key* i zrób **osobny klucz
`sb_secret_` dla `/ai`, osobny dla `/web` i osobny dla skryptu seed** — wtedy wyciek jednego nie
wymusza wymiany wszystkich w trakcie demo.

⚠ RLS jest w prototypie **wyłączone**, więc klucz `sb_publishable_` może **czytać i zapisywać**
każdą tabelę, a trafia do przeglądarki. To świadomy kompromis na demo (slajd „roadmap”), nie błąd.
Klucza `sb_secret_` nigdy nie wkładamy do komponentu klienckiego.

Pełna instrukcja z klikaniem po panelu: [`docs/setup-deploy.md`](setup-deploy.md) §1.2.

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

## Git push nie działa (403)

Jeśli `git push` zwraca **403**, a `git pull` działa — to często **Zscaler**, nie brak tokena. Zobacz [`docs/GIT-PUSH-ZSCALER.md`](GIT-PUSH-ZSCALER.md) i skrypt `scripts/git-push-safe.sh`.
