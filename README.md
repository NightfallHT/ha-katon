# Małopolski Hub Innowacji Społecznych

> ha-katon — ja mówiem HA a wy KATON

Prototyp platformy dla **Małopolskiego Hubu Innowacji Społecznych** (ROPS Kraków),
zbudowany na HackYeah 2026.

Platforma łączy mieszkańców, organizacje pozarządowe, gminy, ekspertów i pracowników ROPS wokół
innowacji społecznych: zgłoszone problemy są dopasowywane do istniejących innowacji, nowe pomysły
rozwijane i finansowane, a instytucje dostają pomoc w zamianie innowacji w usługi publiczne.

**Demo:** _(URL pojawi się po pierwszym wdrożeniu — patrz [docs/setup-deploy.md](docs/setup-deploy.md))_

---

## Quick start

`node` is **not** on `PATH` on the dev machine (NixOS). Use the pinned dev shell:

```bash
nix-shell                  # node 24.19.0, npm 11.17.0, python 3.11.16, supabase-cli
cd web && npm run dev      # http://localhost:3000
```

One-shot, without entering the shell:

```bash
nix-shell --run 'cd web && npm run dev'
nix-shell --run 'cd web && npm run lint'
nix-shell --run 'cd web && npm run build'
nix-shell --run 'npm run seed'            # seeds /data/seed/*.json into Supabase
nix-shell --run 'cd tests && npm test'    # Playwright a11y + smoke
```

Secrets: copy the relevant block from [.env.example](.env.example) into `web/.env.local`
(and `ai/.env`). Supabase + Vercel setup: [docs/setup-deploy.md](docs/setup-deploy.md).

## Layout

| Path | What | Owner |
|---|---|---|
| [web/](web/) | Next.js 16 App Router + TypeScript + Tailwind v4 + shadcn/ui | Ola (shell, `/dopasuj`, `/middleman`, `lib/`), Hania (theme, `/biblioteka`, `/wyzwania`, `/materialy`, `/kreator`), Jakub (`/admin`, `/kontakt`, `/moje-zgloszenia`, bot) |
| [ai/](ai/) | Python 3.11 FastAPI — LLM matchmaking, middleman, help bot | Janek |
| [db/schema.sql](db/schema.sql) | Supabase Postgres + pgvector schema | Ola |
| [scripts/](scripts/) | `seed.ts` — loads seed data into Supabase | Ola |
| [data/seed/](data/seed/) | `innovations.json`, `challenges.json`, `materials.json`, `gminas.json`, `calls.json`, `submissions.json` | Klaudia |
| [tests/](tests/) | Playwright + axe accessibility and smoke tests | Sylwia |
| [docs/content/](docs/content/) | Polish UI copy, FAQ, research notes, costs | Klaudia |
| [docs/pitch/](docs/pitch/) | Slides, video script, project description | Klaudia + Sylwia |

## Read before writing code

- **[AGENTS.md](AGENTS.md)** — what we are building, the demo story, the stack, the DB schema (§5),
  the `/web` ⇄ `/ai` API contract (§6), the non-negotiable accessibility rules (§7) and the
  checkpoint timetable (§9). **Only edit files you own** (§4).
- **[DEPENDENCIES.md](DEPENDENCIES.md)** — every dependency + licence, and the NixOS /
  Tailwind-v4 / Playwright gotchas. Add a row when you add a package.
- **[agents/](agents/)** — the per-person briefs.

Accessibility is 20% of the score and seniors are a primary persona: WCAG 2.1 AA, keyboard-only
operation, visible focus, a font-size toggle and a high-contrast mode are requirements, not extras.
