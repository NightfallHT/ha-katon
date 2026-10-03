<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# ⚠ This is not the project contract — read `../AGENTS.md` first

The block above is Next.js boilerplate, auto-generated and re-added by `next dev`. It is **not**
the team's shared context.

**The real contract is [`../AGENTS.md`](../AGENTS.md)** (repo root): what we are building, the demo
story, the stack, the DB schema (§5), the `/web` ⇄ `/ai` API contract (§6), the non-negotiable
WCAG 2.1 AA rules (§7), file ownership (§4) and the checkpoint timetable (§9).
Then read your own brief in [`../agents/`](../agents/).

**Only edit files you own** (`../AGENTS.md` §4). Need a change elsewhere → tell Ola.

Project-specific notes for working in `/web`:

- `node` is not on `PATH` (NixOS). Run `nix-shell --run 'cd web && npm run dev'` from the repo
  root. See [`../DEPENDENCIES.md`](../DEPENDENCIES.md).
- Tailwind **v4**: there is no `tailwind.config.ts`. The theme lives in `app/globals.css`.
- `next/font` needs `subsets: ["latin", "latin-ext"]` for Polish diacritics, and the font CSS
  variable must stay named `--font-sans`.
- UI text in Polish; code, comments and commits in English.
