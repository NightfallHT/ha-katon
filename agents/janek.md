# Agent brief — Janek (AI service)

Read `AGENTS.md` first. You are the coding agent of **Janek**, AI lead. You own everything in `/ai`: a Python FastAPI service
implementing the contract in `AGENTS.md` §6. Janek is strong in Python and LLMs and likes to move fast — optimise for working
endpoints quickly, then quality.

## Your files
Everything under `/ai`. Nothing else (ask Ola for schema/contract changes).

## Architecture
```
/ai
  main.py              FastAPI app, CORS from ALLOWED_ORIGINS, routes only
  llm.py               ONE module wrapping the LLM + embedding provider (swappable vendor = implementation-potential point)
  db.py                Supabase/psycopg access
  prompts/*.md         all prompts as files, in Polish, versioned
  services/match.py, kreator.py, middleman.py, chat.py, admin.py
  demo_cache.json      cached responses for the exact demo-story inputs
  requirements.txt, Dockerfile (or render.yaml)
```
- Use structured outputs / JSON mode for every endpoint; validate with Pydantic models that mirror §6 exactly.
- Every LLM call: timeout, one retry, and a graceful Polish error.
- `DEMO_MODE=1` env: if the request matches a key in `demo_cache.json`, return the cached response instantly (live-demo insurance).

## Tasks (in order)

### 1. Accounts + mocks (by 16:00)
- Buy/obtain LLM API access and keys; share non-secret info with Ola; put keys only in Render/Railway env.
- Scaffold FastAPI with **all endpoints returning realistic hardcoded Polish responses** matching §6. Deploy. Send URL to Ola.
- **Done when**: `GET /health` and every mocked POST work from the deployed URL with CORS for the Vercel domain.

### 2. Matchmaking — P0 (by 19:30)
- Test the embedding model on 5 Polish problem descriptions vs Klaudia's seed innovations before committing to it. Set `vector(N)` dim with Ola.
- `/admin/reembed`: embed `title + summary + description + tags + target_groups` for every innovation.
- `/match` pipeline:
  1. LLM extracts `{category (from the fixed list), target_group, location, keywords}` from the query.
  2. Embed the query (+ keywords) → `match_innovations` RPC top 10.
  3. Hybrid boost: +score if category matches, +score for keyword overlap with tags (protects against weak Polish embeddings).
  4. LLM re-ranks top 10 → top 3–5 and writes `why` (one plain sentence, addressed to the user, referencing their words).
  5. Insert row into `needs`; count similar needs (same category in last 90 days) for `similar_needs`.
- Return a `low_confidence` flag internally → expose as `score` < 0.5 so Ola shows "zgłoś jako nowy pomysł". Tell Ola the threshold.
- **Done when**: Pani Halina's query (loneliness + transport for seniors in a rural gmina) returns relevant results in < 8 s.

### 3. Simplify + admin enrich (by 20:30)
- `/simplify`: easy-read Polish (tekst łatwy do czytania): short sentences, common words, max ~80 words.
- `/admin/enrich`: summary (1 sentence), 3–6 tags, category from the fixed list.

### 4. Middleman (by 23:30) — the most "wow" feature for the jury
- `/middleman/chat`: system prompt = experienced social-policy consultant for Małopolska. Loads the innovation and gmina profile.
  Asks **one question at a time** (max 4): who exactly is affected, what exists locally already, partners (CUS, OPS, NGOs, parish, schools), budget/staff constraints.
  Must probe **root causes**, not just symptoms (e.g. loneliness ← no transport, depopulation, young people leaving). Sets `done` when enough.
- `/middleman/report`: full structure from §6. Cost estimate realistic for the gmina size; label it "szacunek orientacyjny".
  The "Usługa wrażliwa" checklist: use what Klaudia gets from mentors (`/docs/content/usluga-wrazliwa.md`); until then, generic items (cel, grupa docelowa, partnerzy, budżet, wskaźniki, trwałość).
- **Done when**: wójt demo scenario produces a coherent report in < 20 s.

### 5. Kreator assistant + grant draft (by 01:00)
- `/kreator/assist`: coach following the Social Innovation Canvas (problem, users, solution, value, resources, partners, testing, scale). Suggest 1–2 unconventional ideas per turn; fill `updated_fields` only when the user agrees.
- `/kreator/grant-draft`: sections + budget table that sums ≤ `budget_max`; categories: personel, materiały, usługi, promocja, inne.

### 6. Help bot (by 02:00)
- `/chat`: answers questions about the platform and social innovations using a small RAG over: innovations (title+summary), materials, `/docs/content/faq.md` (Klaudia), and a short description of each module and route.
- Always answer in plain Polish, ≤ 5 sentences, link sources/pages. If unsure or the user wants a person → `handoff: true`.

### 7. Demo hardening (01:00–03:30)
- Fill `demo_cache.json` with the exact demo-story inputs (Klaudia's script). Tune prompts on them.
- Check latency; add streaming only if trivial.

## Prompt rules
- All prompts in Polish, in `prompts/`. Persona: warm, concrete, no jargon. Never invent facts about real people or institutions.
- Output only data that fits the Pydantic model. Temperature low for extraction, moderate for ideas.

## Don't
- Don't touch `/web`. Don't change response shapes without Ola.
- Don't log user texts anywhere except the `needs` table.

## Status / TODO

Last updated: 2026-10-03 18:53
Currently working on: live OpenAI/Supabase integration and deployment

- [x] FastAPI scaffold, exact Pydantic contract, mocks, CORS and Docker/Render config
- [x] Matchmaking extraction, hybrid ranking, reranking, low-confidence handling and demo cache
- [x] `/simplify`, `/admin/enrich` and `/admin/reembed`
- [x] Middleman questions/report with root causes and “Usługa wrażliwa” checklist
- [x] Kreator assistant, grant draft and budget cap
- [x] FAQ/RAG help bot with sources and human handoff
- [x] OpenAI key verified locally for `gpt-4o-mini` and `text-embedding-3-small`
- [ ] **IN PROGRESS:** test live model calls and re-embedding against the seeded Supabase project
- [ ] Deploy `/ai`, set secrets only in hosting env and send the public URL to Ola
- [ ] Measure live latency for exact demo inputs; keep cache responses below the demo threshold
- [ ] **BLOCKED:** production URL/CORS — waiting for Render/Railway deployment and Ola's Vercel origin
