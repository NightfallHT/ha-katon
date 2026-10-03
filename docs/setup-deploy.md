# Supabase + Vercel setup

These are the two steps of Ola's bootstrap task that need **your** accounts — I cannot log in for
you. Everything else (repo, app, dependencies, schema file, env template) is done.

Run every command inside the dev shell: `nix-shell` from the repo root, or prefix with
`nix-shell --run '…'`.

---

## 1. Supabase (do this first — Vercel needs the keys)

AGENTS.md §3 requires an **EU region**. Pick `eu-central-1` (Frankfurt).

1. Create the project at <https://supabase.com/dashboard> → *New project*
   - Region: **Central EU (Frankfurt) `eu-central-1`**
   - Save the database password somewhere safe
2. Enable pgvector and create the tables. Two options — the SQL editor is the fastest:

   **Option A (fastest):** Dashboard → *SQL Editor* → paste the whole of
   [`db/schema.sql`](../db/schema.sql) → *Run*. It begins with
   `create extension if not exists vector;` so the extension is handled.

   **Option B (CLI):**
   ```bash
   nix-shell --run 'supabase login'
   nix-shell --run 'supabase link --project-ref <YOUR-PROJECT-REF>'
   nix-shell --run 'supabase db push'
   ```
   The project ref is in the dashboard URL: `supabase.com/dashboard/project/<ref>`.

3. Verify: *Table editor* should list `innovations`, `challenges`, `materials`, `needs`, `calls`,
   `submissions`, `messages`, `reviews`, `gminas` — 9 tables — and *Database → Functions* should
   show `match_innovations`.

4. Copy the credentials from *Project Settings → API*:

   | Dashboard field | Env var |
   |---|---|
   | Project URL | `NEXT_PUBLIC_SUPABASE_URL` **and** `SUPABASE_URL` (for `/ai`) |
   | `anon` `public` key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
   | `service_role` `secret` key | `SUPABASE_SERVICE_ROLE_KEY` |

5. Local dev — create `web/.env.local` (gitignored) from [`.env.example`](../.env.example), and a
   root `.env` with `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` so `npm run seed` works.

> The `service_role` key bypasses all access control. It belongs in `web/.env.local`, the root
> `.env`, and Vercel/Render env settings only. Never in a client component, never
> `NEXT_PUBLIC_`-prefixed, never committed.

---

## 2. Vercel

The app is **not** at the repo root, so the root directory must be set to `web`.

### Dashboard route (recommended — gives you auto-deploy on push to `main`)

1. <https://vercel.com/new> → import `NightfallHT/ha-katon`
2. **Root Directory: `web`** ← the one setting that is easy to miss
3. Framework preset: Next.js (auto-detected). Leave build/output commands default.
4. *Environment Variables* → add all six from the `web` block of
   [`.env.example`](../.env.example), for **Production, Preview and Development**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_AI_URL` — Janek's Render URL; put a placeholder now, update when he ships
   - `RESEND_API_KEY` — can stay empty; `/api/notify` logs and returns ok without it
   - `ADMIN_NOTIFY_EMAIL`
5. *Deploy*. Push to `main` redeploys from then on.

### CLI route

```bash
nix-shell --run 'npx vercel login'
nix-shell --run 'npx vercel link'          # answer "web" when asked for the root directory
nix-shell --run 'npx vercel --prod'
```

### After the first deploy

- [ ] Share the live URL in the team chat — this is Ola's task-1 deliverable (`agents/ola.md`)
- [ ] Put the URL in the **Demo** line of [`README.md`](../README.md)
- [ ] Give the URL to **Janek** for `ALLOWED_ORIGINS` (CORS) on the `/ai` service
- [ ] Give the URL to **Sylwia** as `BASE_URL` for the Playwright suite:
      `nix-shell --run 'cd tests && BASE_URL=https://… npm test'`

---

## 3. Still outstanding (not blocked on accounts)

| Item | Owner | Note |
|---|---|---|
| `/ai` FastAPI service on Render/Railway + `NEXT_PUBLIC_AI_URL` | Janek | mocked endpoints due by 16:00 (AGENTS.md §9) |
| Embedding dimension in `db/schema.sql` | Janek → Ola | `vector(1536)` is provisional; changes in **two** places in the file |
| `lib/types.ts`, `lib/api.ts`, `lib/supabase.ts`, `lib/categories.ts`, `scripts/seed.ts` | Ola | task 2 — unblocks Hania, Jakub, Janek |
| Real header (role switcher, font-size + contrast toggles) and home page | Ola | task 3; `web/app/layout.tsx` is a placeholder with `TODO(ola, task 3)` |
| Seed JSON in `/data/seed/` | Klaudia | `npm run seed` is wired and waiting |
