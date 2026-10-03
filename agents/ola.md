# Agent brief — Ola (tech lead & integrator)

Read `AGENTS.md` first. You are the coding agent of **Ola**, the tech lead. You own the app skeleton, the database, deployment,
the shared API client, and the two flagship screens: **Matchmaking (`/dopasuj`)** and **Middleman (`/middleman`)**.
Ola's skills: JS, HTML, SQL, architecture. She reviews everything critically — give her short, clear diffs and explain trade-offs.

## Your files
`/web/app/layout.tsx`, `/web/app/page.tsx`, `/web/components/shell/*`, `/web/app/dopasuj/*`, `/web/app/middleman/*`,
`/web/lib/api.ts`, `/web/lib/supabase.ts`, `/web/lib/types.ts`, `/web/lib/categories.ts`, `/db/schema.sql`, `/scripts/seed.ts`,
`AGENTS.md`, `DEPENDENCIES.md`, deploy config.

## Tasks (in order)

### 1. Bootstrap (by 15:30)
- Create the monorepo: `/web` (`create-next-app` with TS, Tailwind, App Router, ESLint), `/ai` empty folder for Janek, `/data/seed`, `/tests`, `/docs`, `/db`.
- Init shadcn/ui in `/web` (Hania will theme it). Add `eslint-plugin-jsx-a11y`.
- Connect Vercel to `/web` and confirm a deploy from `main`. Share the URL in the team chat.
- Create Supabase project (EU region), enable `vector`, run `/db/schema.sql` from `AGENTS.md` §5.
- `.env.example` with all vars from `AGENTS.md` §3.
- **Done when**: live URL shows a placeholder page; tables exist in Supabase.

### 2. Shared plumbing (by 16:30)
- `lib/types.ts`: TS types mirroring §5 tables and §6 API shapes exactly.
- `lib/api.ts`: typed functions `match()`, `simplify()`, `kreatorAssist()`, `grantDraft()`, `middlemanChat()`, `middlemanReport()`, `chat()`, `adminEnrich()`; each with a 30 s timeout and a Polish error message.
- `lib/supabase.ts`: browser client (anon) + server client (service role, server-only).
- `lib/categories.ts`: slug → Polish label + icon name.
- `scripts/seed.ts`: reads `/data/seed/*.json` (from Klaudia), upserts into tables. Then call `POST /admin/reembed`.
- **Done when**: other members can import types and api functions; seed runs with Klaudia's sample file.

### 3. App shell (by 17:30)
- `layout.tsx`: `<html lang="pl">`, skip link, `header` / `nav` / `main id="main"` / `footer`.
- Header: logo + name, main nav (Dopasuj, Biblioteka, Wyzwania, Kreator, Kontakt; Middleman visible for `gmina`; Admin for `admin`),
  **role switcher** (select, sets cookie `role` + `demo_email`, labelled "Oglądasz jako:"),
  **font-size toggle** (A / A+ / A++ → sets `data-font` on `<html>`, CSS scales `rem`) and **high-contrast toggle** (`data-contrast="high"`), both persisted in `localStorage` (wrap in try/catch).
- Global slot for Jakub's `<HelpBot />`.
- Home page: one big question "Z jakim problemem się mierzysz?" with a textarea + button → goes to `/dopasuj?q=...`; below, three entry tiles (Znajdź rozwiązanie / Zgłoś pomysł / Dla instytucji).
- **Done when**: keyboard-only user can reach everything; toggles work on every page; axe shows no violations on `/`.

### 4. Matchmaking UI `/dopasuj` (by 20:00 — P0)
- Step 1: textarea "Opisz problem własnymi słowami" + optional location select (gminas from DB) + **microphone button** using Web Speech API (`pl-PL`), hidden if unsupported. Example prompts as clickable chips.
- Step 2: loading state with text in `aria-live`. Show "Zrozumieliśmy, że chodzi o: <category>, <target group>, <location>" with an "Edytuj" link.
- Step 3: 3–5 result cards (reuse Hania's `InnovationCard`), each with a highlighted **"Dlaczego to pasuje"** sentence and "Wyjaśnij prościej".
- Line "N osób zgłosiło podobny problem" from `similar_needs`.
- **Empty / weak result** (top score < threshold Janek gives): "Nie znaleźliśmy gotowego rozwiązania — zgłoś to jako nowy pomysł" → `/kreator?problem=<query>` prefilled.
- Results heading receives focus when loaded.
- **Done when**: Pani Halina's demo query returns sensible results on the live URL.

### 5. Middleman UI `/middleman` (by 01:00)
- Visible only for role `gmina` (others see an explanation + "Przełącz na: Gmina").
- Step 1: pick innovation (searchable list) and gmina (select → profile shown as a small summary card).
- Step 2: chat with `/middleman/chat`; messages in an `aria-live` log; input with label; "Mam dość informacji — przygotuj projekt usługi" button (enabled when `done` or after 3 turns).
- Step 3: report from `/middleman/report` as a readable page: Przyczyny problemu, Projekt usługi, Partnerzy, Kadra, Koszty (table with total), Wskaźniki, Ryzyka, Checklista "Usługa wrażliwa". "Pobierz PDF" via `window.print()` with a print stylesheet (no extra library).
- **Done when**: the wójt demo scenario goes from selection to PDF.

### 6. Integration & leadership (continuous)
- Merge small PRs fast; keep `main` deployable. Run the checkpoint demos (`AGENTS.md` §9).
- At 01:00 write the gap list; at 04:00 cut anything not clickable.
- Keep `DEPENDENCIES.md` complete.

## Don't
- Don't build features owned by others; unblock them instead.
- Don't add auth, RLS or state libraries. Server components + fetch + `useState` are enough.

## Status / TODO

Last updated: 2026-10-03 18:53
Currently working on: live integration and deployment checks

- [x] Bootstrap monorepo, shared types/API client, Supabase schema and seed script
- [x] App shell, role switcher, accessibility toggles and homepage
- [x] Matchmaking UI with local fallback and low-confidence path
- [x] Middleman UI with report, cost table and print/PDF flow
- [ ] **IN PROGRESS:** verify the complete demo path against live `/ai` and Supabase
- [ ] Deploy `/web` to Vercel and share `NEXT_PUBLIC_AI_URL` / Vercel URL with Janek
- [ ] Run the 01:00 gap review and keep `DEPENDENCIES.md` current
- [ ] **BLOCKED:** production integration — waiting for deployed `/ai` URL and hosting environment values
