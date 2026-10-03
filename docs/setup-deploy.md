# Supabase + Vercel setup

These are the two steps of Ola's bootstrap task that need **your** accounts — I cannot log in for
you. Everything else (repo, app, dependencies, schema file, env template) is done.

Run every command inside the dev shell: `nix-shell` from the repo root, or prefix with
`nix-shell --run '…'`.

---

## 1. Supabase (do this first — Vercel needs the keys)

AGENTS.md §3 requires an **EU region**. Pick `eu-central-1` (Frankfurt).

### 1.1 Create the project and the tables

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

### 1.2 Copy the API keys — use the new ones, not the legacy tab

Dashboard → **Settings → API Keys**. You will see two groups. Take the **current** keys:

| Dashboard             | Env var                     | Notes |
|---                    |---                          |---    |
| Project URL           | `NEXT_PUBLIC_SUPABASE_URL` **and** `SUPABASE_URL` (for `/ai`) | *Settings → Data API* |
| **Publishable key** `sb_publishable_…` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser-safe |
| **Secret key** `sb_secret_…` | `SUPABASE_SERVICE_ROLE_KEY` | server only, bypasses RLS |

Ignore the **Legacy API keys** tab (`anon` / `service_role` JWTs). Supabase is deprecating those
**by the end of 2026**; the new keys have the same permissions but are short strings rather than
JWTs, are independently rotatable, are instantly revocable, and secret keys are technically
blocked from browser use. `@supabase/supabase-js` and the REST calls in `/ai` take them in exactly
the same argument position, so there is nothing to change in code.

> **Why the env var names still say `ANON` / `SERVICE_ROLE`.** Those names are already baked into
> `ai/db.py`, `ai/render.yaml`, `.env.keys.example` and `docs/KLUCZE.md`, and `/ai` is deployed
> with them. Renaming them to `…PUBLISHABLE_KEY` / `…SECRET_KEY` would mean editing Janek's files
> *and* renaming the variable in the Render dashboard — a live breakage for zero functional gain
> this close to submission. So: **old names, new `sb_…` values.** Worth tidying after the
> hackathon, not during it.

Click *Create new secret key* and make a **separate** secret key per consumer — one for `/web`,
one for `/ai`, one for the seed script. They can be revoked individually, so a leak during the
demo does not force you to rotate everything at once.

> ⚠ **RLS is off in this prototype** (AGENTS.md §5), so the publishable key can read **and write**
> every table — and it ships inside the browser bundle. That is a deliberate, documented
> trade-off for a 24-hour demo, not an oversight; it belongs on the roadmap slide next to
> "RLS + real auth". Do not put the **secret** key in a client component — that is a different
> and much worse problem, because it also bypasses RLS once RLS exists.

### 1.3 Where the keys actually live

**Secrets are never committed.** `.gitignore` already excludes every `.env*` file except the
empty template [`.env.example`](../.env.example), so these three files stay local:

| File | Holds | Used by |
|---|---|---|
| `web/.env.local` | the whole `web` block | `npm run dev` |
| `.env` (repo root) | `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | `npm run seed` |
| `ai/.env` | the `ai` block | Janek's FastAPI service |

```bash
cp .env.example web/.env.local     # then fill in the web block, delete the ai block
```

Prove nothing is tracked, any time:

```bash
git check-ignore -v .env web/.env.local ai/.env   # all three must print a match
git status --short                                 # must not list any .env file
```

For the deployed app the same values are pasted into the **Vercel** (and Render, for `/ai`)
environment-variable settings — not into files. If a key is ever pasted somewhere public,
revoke that one key in *Settings → API Keys* and create a new one; that is exactly what the new
key model is for.

---

## 2. Vercel

The Next.js app lives in `web/`, not at the repo root. **Leave the Root Directory at the repo
root** — [`vercel.json`](../vercel.json) handles the subdirectory:

```json
{
  "framework": "nextjs",
  "installCommand": "cd web && npm install",
  "buildCommand": "cd web && npm run build",
  "outputDirectory": "web/.next",
  "regions": ["fra1"]
}
```

What each line does, so nobody "fixes" it later:

| Key | Why |
|---|---|
| `framework: "nextjs"` | There is no Next.js at the repo root, so auto-detection fails and the app would deploy as static files. This forces Vercel's Next.js builder, which is what turns `/admin/*`, `/api/notify`, `/api/submit`, `/biblioteka` and `/kontakt` into real server functions. |
| `installCommand` / `buildCommand` | Both run from the repo root in a fresh shell, hence `cd web &&` in each. |
| `outputDirectory: "web/.next"` | Where Vercel reads `BUILD_ID`, `routes-manifest.json` and `required-server-files.json` from. |
| `regions: ["fra1"]` | `fra1` is `eu-central-1`, Frankfurt — **the same region as Supabase**. Vercel defaults functions to `iad1` (Washington DC), which would put our server code in the US querying a database in the EU: slower, and it undercuts the EU-data-residency claim on the architecture slide. |

[`.vercelignore`](../.vercelignore) keeps `ai/`, `tests/`, `data/`, `docs/` and friends out of the
upload. `web/` is self-contained — nothing under it imports from outside, and it carries its own
seed copy in `web/content/seed` — so excluding the rest is safe. If that ever changes, check with:

```bash
grep -rn "\.\./\.\./\.\." web/app web/lib web/components
```

### Dashboard route (recommended — gives you auto-deploy on push to `main`)

1. <https://vercel.com/new> → import `NightfallHT/ha-katon`
2. **Leave Root Directory as the repo root.** Do not set it to `web`; `vercel.json` already
   points at `web/`, and setting both makes the paths resolve twice (it would look for
   `web/web/.next`).
3. Framework / build / output: leave everything on defaults — `vercel.json` overrides them.
4. *Environment Variables* → add all six from the `web` block of
   [`.env.example`](../.env.example), for **Production, Preview and Development**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — the `sb_publishable_…` key
   - `SUPABASE_SERVICE_ROLE_KEY` — the `sb_secret_…` key; mark it **Sensitive** in Vercel so it
     cannot be read back from the dashboard afterwards
   - `NEXT_PUBLIC_AI_URL` — Janek's Render URL; put a placeholder now, update when he ships
   - `RESEND_API_KEY` — can stay empty; `/api/notify` logs and returns ok without it
   - `ADMIN_NOTIFY_EMAIL`
5. *Deploy*. Push to `main` redeploys from then on.

### CLI route

```bash
nix-shell --run 'npx vercel login'
nix-shell --run 'npx vercel link'     # accept the repo root; do NOT answer "web"
nix-shell --run 'npx vercel --prod'
```

### If the build fails

| Symptom | Cause |
|---|---|
| `No Next.js version detected` | `framework` or `installCommand` was dropped — Vercel is looking at the repo root, where there is no `next` dependency. |
| Build succeeds, every page 404s | `outputDirectory` is wrong, or Root Directory was *also* set to `web`. |
| Pages render but admin/API routes 404 | `framework: "nextjs"` is missing, so nothing became a server function. |

You can reproduce the exact Vercel build locally before pushing:

```bash
nix-shell --run 'cd web && npm install'
nix-shell --run 'cd web && npm run build'
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
