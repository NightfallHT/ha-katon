# AGENTS.md — shared context for every AI agent on this repo

> Put this file in the repo root (also copy it as `CLAUDE.md` / `.cursorrules` if your tool needs that name).
> Every agent reads this first, then its owner's brief in `agents/<name>.md`.

## 1. What we are building

A prototype platform for **Małopolski Hub Innowacji Społecznych** (ROPS Kraków), built at HackYeah 2026.
Deadline: **Sunday 4 Oct 2026, 11:00** (we submit at 10:30). Code freeze **07:00**. Feature freeze **04:00**.

It connects residents, NGOs, gminas (JST), experts and ROPS staff around social innovations:
problems people report get matched with existing innovations, new ideas get developed and funded,
and institutions get help turning innovations into public services.

The jury is **non-technical**. They click the live demo, watch a 3-minute video and read 10 slides.
Anything not visible in the UI earns nothing. Working + simple + accessible beats clever + broken.

### Scoring (drives every decision)
| Criterion | Weight | Implication for code |
|---|---|---|
| Challenge fulfilment | 40% | Matchmaking = 10%, each further module +5%. Every module must be clickable. |
| Implementation potential | 20% | Managed services, swappable LLM, simple admin, no dev needed to update content. |
| Accessibility & intuitiveness | 20% | WCAG 2.1 AA. Seniors and people with low digital skills must manage alone. |
| UI appeal & creativity | 10% | Consistent visual identity, a few memorable touches. |
| Materials & MVP quality | 10% | The demo story must run end to end without errors. |

### The 7 modules
| # | Module (working name) | Route | Owner |
|---|---|---|---|
| I | Matchmaking społeczny (P0, mandatory) | `/dopasuj` | Janek (AI) + Ola (UI) |
| II | Zasobnik wiedzy: library, challenges, materials, admin trends | `/biblioteka`, `/wyzwania`, `/materialy`, `/admin/trendy` | Hania (+ Jakub for trends) |
| III | Kreator pomysłów: fiszka, good practice, grant application, AI assistant | `/kreator` | Hania (UI) + Janek (assistant) |
| IV | Tester innowacji: sign up to test, rate, feedback | component on `/biblioteka/[id]` | Jakub |
| V | Komunikacja: contact form, AI help bot, "Moje zgłoszenia", email notifications | `/kontakt`, `/moje-zgloszenia`, global bot widget | Jakub + Janek (bot) |
| VI | Panel administratora | `/admin/*` | Jakub + Ola |
| VII | Middleman Innowacji (institutions only) | `/middleman` | Janek (AI) + Ola (UI) |

## 2. Demo story (the spine — every feature must serve a step)
1. **Pani Halina, 70**, rural gmina, describes by voice/text that older neighbours are lonely and can't get to the doctor → `/dopasuj` returns 3 innovations with "why this fits".
2. She opens one, signs up to test it, rates it; asks the help bot a question.
3. A local **NGO** creates an idea in `/kreator` with the AI assistant; a nabór is open → generates a grant application.
4. A **ROPS employee** gets an email, opens `/admin`, replies, publishes the idea to the library, sees the "samotność / gminy wiejskie" trend rising.
5. A **wójt** uses `/middleman`: AI asks about the gmina, finds the root cause (transport exclusion) and drafts a service for the "Usługa wrażliwa" programme, downloadable as PDF.
6. Same flow in high contrast + large font.

## 3. Stack
- **Monorepo**: `/web` (Next.js 14+ App Router, TypeScript, Tailwind, shadcn/ui), `/ai` (Python 3.11, FastAPI), `/data` (seed), `/tests` (Playwright), `/docs`.
- **DB**: Supabase Postgres (EU region) + `pgvector`. Supabase JS client in `/web`, `supabase-py` or `psycopg` in `/ai`.
- **Hosting**: `/web` on Vercel, `/ai` on Render/Railway. Push to `main` = deploy.
- **Email**: Resend (`RESEND_API_KEY`), sent from Next.js route handlers.
- **Charts/map**: Recharts, Leaflet. Every chart/map has a table alternative.
- **Auth**: none. A **demo role switcher** in the header sets a cookie `role` = `mieszkaniec | ngo | gmina | ekspert | admin`. Demo user email stored in the cookie `demo_email`.
- Only MIT/Apache/BSD libraries. Add every new dependency to `DEPENDENCIES.md` (required by the copyright agreement if we win).

### Env vars
```
# web
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # holds the sb_publishable_... key, see below
SUPABASE_SERVICE_ROLE_KEY=        # holds the sb_secret_... key, server-side only
NEXT_PUBLIC_AI_URL=               # e.g. https://hubmi-ai.onrender.com
RESEND_API_KEY=
ADMIN_NOTIFY_EMAIL=
# ai
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
LLM_API_KEY=
LLM_MODEL=
EMBEDDING_MODEL=
ALLOWED_ORIGINS=                  # web URL(s) for CORS
```
Never commit keys. Never put keys in client code (`NEXT_PUBLIC_*` only for public values).
Local secrets: copy [`.env.keys.example`](.env.keys.example) → `.env.keys` and follow [`docs/KLUCZE.md`](docs/KLUCZE.md). **AI agents:** if secrets are missing for the task, point the human to that doc and offer to sync `.env.keys` → `ai/.env` / `web/.env` without pasting keys into chat.

**Supabase API keys — take the NEW keys, not the "Legacy API keys" tab.**
Dashboard → *Settings → API Keys*. Supabase deprecates the legacy `anon` / `service_role` JWTs
**by the end of 2026**, so we use the current key model:

| Use | Copy this key | Into this env var | Legacy equivalent |
|---|---|---|---|
| browser, anything we ship | `sb_publishable_...` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` JWT |
| server, `/ai`, seed script | `sb_secret_...` | `SUPABASE_SERVICE_ROLE_KEY` | `service_role` JWT |

⚠ **The env var names are legacy-flavoured, the values are not.** We kept the names because `/ai`,
`render.yaml`, `.env.keys` and `docs/KLUCZE.md` already use them — renaming mid-hackathon would
break a deployed service for no functional gain. Put the `sb_…` values in the old names. Create a
**separate secret key per consumer** (`/web`, `/ai`, seed) — the new keys are individually
revocable, so one leak does not force a full rotation mid-demo.

The new keys are short strings, not JWTs. Permissions are unchanged: publishable resolves to the
`anon` / `authenticated` Postgres role, secret resolves to `service_role` and **bypasses RLS**.
`@supabase/supabase-js` and the REST calls in `/ai` take them in the same position — no code change.

⚠ **RLS is off in this prototype (§5), so the publishable key can read _and write_ every table** —
and it ships in the browser bundle. That is an accepted prototype trade-off, not a mistake; say so
on the roadmap slide alongside "RLS + real auth". Never put the secret key in a client component.

## 4. Repo layout and ownership
**Only edit files you own.** Need a change elsewhere → tell your owner, don't do it yourself.
```
/web
  app/layout.tsx, app/page.tsx, components/shell/*      Ola   (header, role switcher, a11y toggles, skip link, footer)
  app/dopasuj/*, app/middleman/*                        Ola
  lib/api.ts (typed client for /ai), lib/supabase.ts    Ola
  lib/types.ts                                          Ola   (shared TS types — mirrors section 6)
  components/ui/* (shadcn), app/globals.css, theme      Hania
  app/biblioteka/*, app/wyzwania/*, app/materialy/*     Hania
  app/kreator/*                                         Hania
  components/innovation-card.tsx                        Hania
  app/admin/*, app/kontakt/*, app/moje-zgloszenia/*     Jakub
  components/tester-panel.tsx                           Jakub (Hania embeds it on /biblioteka/[id])
  components/help-bot.tsx                               Jakub (UI) — calls /ai/chat
  app/api/notify/route.ts (emails)                      Jakub
/ai                                                     Janek
/db/schema.sql, /scripts/seed.ts                        Ola
/data/seed/*.json, /docs/content/*                      Klaudia
/tests/*                                                Sylwia
/docs/pitch/*                                           Klaudia + Sylwia
```

## 5. Database schema (`/db/schema.sql`, owned by Ola)
RLS is **off** for the prototype (mention "RLS + real auth" on the roadmap slide). All ids are `uuid default gen_random_uuid()`.
```sql
create extension if not exists vector;

create table innovations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null,              -- 1–2 plain-language sentences
  description text,
  category text not null,             -- see CATEGORIES below
  target_groups text[] default '{}',
  tags text[] default '{}',
  stage text,                         -- 'pomysł' | 'testowana' | 'wdrożona'
  region text,                        -- powiat or 'cała Małopolska'
  video_url text, image_url text, image_alt text,
  source_url text, contact_org text,
  avg_rating numeric default 0, ratings_count int default 0,
  published boolean default true,
  embedding vector(1536),             -- Janek may change dim to match the embedding model
  created_at timestamptz default now()
);

create table challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null, description text, category text,
  powiat text, indicator_name text, indicator_value numeric, source text
);

create table materials (
  id uuid primary key default gen_random_uuid(),
  title text not null, type text,     -- 'raport' | 'poradnik' | 'film' | 'canvas'
  url text, description text, tags text[] default '{}'
);

create table needs (                  -- every matchmaking query, feeds admin trends
  id uuid primary key default gen_random_uuid(),
  text text not null, category text, target_group text, location text,
  keywords text[] default '{}', role text, created_at timestamptz default now()
);

create table calls (                  -- nabory grantowe
  id uuid primary key default gen_random_uuid(),
  name text not null, description text, is_open boolean default false,
  deadline date, budget_max numeric, regulamin_url text
);

create table submissions (
  id uuid primary key default gen_random_uuid(),
  type text not null,                 -- 'idea' | 'good_practice' | 'grant_application' | 'contact' | 'test_signup'
  title text not null,
  author_name text, author_email text not null, author_role text,
  payload jsonb default '{}',         -- type-specific fields, see section 6
  status text default 'nowe',         -- 'nowe' | 'w_ocenie' | 'zaakceptowane' | 'odrzucone'
  ai_summary text, ai_tags text[] default '{}', ai_category text,
  innovation_id uuid references innovations(id),
  call_id uuid references calls(id),
  created_at timestamptz default now()
);

create table messages (               -- admin <-> author thread per submission
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references submissions(id) on delete cascade,
  sender text not null,               -- 'admin' | 'author'
  body text not null, created_at timestamptz default now()
);

create table reviews (                -- Tester innowacji
  id uuid primary key default gen_random_uuid(),
  innovation_id uuid references innovations(id) on delete cascade,
  rating int check (rating between 1 and 5),
  feedback text, improvement text, author_email text,
  created_at timestamptz default now()
);

create table gminas (                 -- for Middleman profiles (public statistics only)
  id uuid primary key default gen_random_uuid(),
  name text not null, powiat text, type text,   -- 'miejska' | 'wiejska' | 'miejsko-wiejska'
  population int, population_trend text         -- 'spada' | 'stabilna' | 'rośnie'
);

-- vector search used by /ai/match
create or replace function match_innovations(query_embedding vector(1536), match_count int)
returns table (id uuid, title text, summary text, category text, similarity float)
language sql stable as $$
  select id, title, summary, category, 1 - (embedding <=> query_embedding) as similarity
  from innovations where published and embedding is not null
  order by embedding <=> query_embedding limit match_count;
$$;
```
**CATEGORIES** (fixed list, use exactly these slugs):
`starzenie`, `zdrowie_psychiczne`, `samotnosc`, `wykluczenie_cyfrowe`, `dostep_do_uslug`, `niepelnosprawnosc`, `integracja_spoleczna`, `rodzina_dzieci`, `wspolpraca_miedzysektorowa`, `inne`.
Display labels (Polish) live in `/web/lib/categories.ts`.

## 6. API contract: `/web` ⇄ `/ai`
Base URL `NEXT_PUBLIC_AI_URL`. JSON in/out. All text in Polish. Errors: HTTP 4xx/5xx with `{"error": "<Polish message for the user>"}`.
**Janek ships mocked versions of every endpoint by 16:00** (fixed sample responses), so frontend never waits.

```
GET  /health → {"ok": true}

POST /match
  in:  {"query": str, "location"?: str, "role"?: str}
  out: {"need_id": uuid,
        "extracted": {"category": str, "target_group": str, "location": str|null, "keywords": [str]},
        "results": [{"innovation_id": uuid, "title": str, "summary": str, "category": str,
                     "score": float, "why": str}],                 # 3–5 items, why = 1 sentence
        "similar_needs": {"count": int, "example": str|null}}       # "12 osób zgłosiło podobny problem"
  side effect: inserts a row into `needs`.

POST /simplify
  in:  {"text": str}
  out: {"text": str}                                               # easy-read Polish, short sentences

POST /kreator/assist
  in:  {"fiszka": {"title": str, "problem": str, "solution": str, "target_group": str, "stage": str},
        "message": str, "history": [{"role": "user"|"assistant", "content": str}]}
  out: {"reply": str, "suggestions": [str], "updated_fields": {<fiszka key>: str}}

POST /kreator/grant-draft
  in:  {"fiszka": {...}, "call": {"name": str, "budget_max": number, "description": str}}
  out: {"sections": {"cel": str, "grupa_docelowa": str, "dzialania": str, "rezultaty": str},
        "budget": [{"item": str, "category": str, "amount": number}]}

POST /middleman/chat
  in:  {"innovation_id": uuid, "gmina": {"name": str, "type": str, "population": int, "population_trend": str},
        "history": [...], "message": str}
  out: {"reply": str, "done": bool}                                # done=true when enough info for a report

POST /middleman/report
  in:  {"innovation_id": uuid, "gmina": {...}, "history": [...]}
  out: {"report": {"service_name": str, "summary": str,
                   "root_causes": [str], "service_description": str,
                   "delivery_partners": [str], "staffing": str,
                   "cost_estimate": [{"item": str, "amount_pln_per_year": number}],
                   "kpis": [str], "risks": [str],
                   "usluga_wrazliwa_checklist": [{"item": str, "done": bool}]}}

POST /chat                                                          # help bot
  in:  {"message": str, "history": [...], "page"?: str}
  out: {"reply": str, "sources": [{"title": str, "url": str}], "handoff": bool}
                                                                    # handoff=true → UI offers the contact form

POST /admin/enrich
  in:  {"text": str}
  out: {"summary": str, "tags": [str], "category": str}

POST /admin/reembed                                                 # recompute embeddings for all innovations
  out: {"updated": int}
```
Submission `payload` shapes (written by `/web` directly to Supabase):
- `idea` / `good_practice`: `{problem, solution, target_group, stage, location}`
- `grant_application`: `{fiszka:{...}, sections:{...}, budget:[...], accepted_regulamin: true}`
- `contact`: `{message, page}`
- `test_signup`: `{innovation_id, motivation}`

## 7. Accessibility rules (WCAG 2.1 AA) — non-negotiable for every UI file
- `lang="pl"` on `<html>`. Skip link "Przejdź do treści" as first focusable element. One `<h1>` per page, no skipped heading levels. Landmarks: `header`, `nav`, `main`, `footer`.
- Everything works by keyboard; focus always visible (`focus-visible:ring-2`); no keyboard traps; logical tab order.
- Text contrast ≥ 4.5:1 (large text 3:1), UI component borders ≥ 3:1. Test both normal and high-contrast theme.
- Font-size toggle (100/125/150%) and high-contrast toggle in the header; layout must not break at 200% zoom or 320 px width.
- Every input has a visible `<label>`. Errors: text message linked via `aria-describedby`, never colour alone. Required fields marked in text ("wymagane").
- Buttons are `<button>`, links are `<a>`. Icon-only buttons have `aria-label`. Min target size 44×44 px.
- Images: meaningful `alt`; decorative `alt=""`. Videos: captions or a text description below.
- AI responses and async results announced via `aria-live="polite"`; loading states have text ("Szukam pasujących rozwiązań…").
- Charts and maps always have a table or list alternative right next to them.
- Respect `prefers-reduced-motion`. No auto-playing media.
- Plain Polish: short sentences, no jargon, one main action per screen in wizards. Every AI answer gets a "Wyjaśnij prościej" button (calls `/simplify`).

## 8. Conventions
- UI text in **Polish**; code, comments, commits in English.
- Small commits, push often, `main` must always deploy. Pull before you push. No force-push.
- Don't change the API contract or schema on your own — ask Ola, she updates this file and tells everyone.
- No real personal data. Seed people are fictional ("Anna K., NGO Razem Bliżej").
- If a task can't be finished by its checkpoint, ship the simplest working version and leave a `TODO(demo)` comment.

## 9. Checkpoints
| Time | Gate |
|---|---|
| Sat 16:00 | Both apps deployed, `/ai` mocks answer, schema + seed in Supabase |
| Sat 20:00 | Matchmaking works end to end on the live URL |
| Sun 01:00 | Every module clickable; gaps listed |
| Sun 04:00 | **Feature freeze** — unfinished slices are cut |
| Sun 07:00 | **Code freeze** — only copy and CSS after this |
| Sun 10:30 | Submitted on HackTribe |
