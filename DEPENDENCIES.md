# DEPENDENCIES.md

Every third-party dependency, with its licence. Required by the HackYeah copyright agreement
(AGENTS.md §3). **Add a row here whenever you add a package.** Owner: Ola.

**Licence policy: MIT / Apache-2.0 / BSD / ISC only.** Nothing copyleft, nothing
ethical-source. If a package you need is licensed otherwise, tell Ola — do not just install it.

---

## Toolchain (NixOS — read this first)

`node`, `npm` and `python3` are **not on `PATH`** on this machine. Everything runs inside the
pinned dev shell at [shell.nix](shell.nix):

```bash
nix-shell                     # node 24.19.0, npm 11.17.0, python 3.11.16, supabase-cli 2.100.1
cd web && npm run dev
```

Or one-shot, without entering the shell:

```bash
nix-shell --run 'cd web && npm run dev'
```

`shell.nix` also sets `PLAYWRIGHT_BROWSERS_PATH` to the nixpkgs browser bundle and
`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`.

| Tool | Version | Licence | Why |
|---|---|---|---|
| nodejs | 24.19.0 | MIT | runs `/web`, `/tests`, `scripts/` |
| python311 | 3.11.16 | PSF-2.0 | `/ai` FastAPI service (Janek) |
| supabase-cli | 2.100.1 | Apache-2.0 | `supabase link`, `supabase db push` |
| playwright-driver.browsers | 1.59.1 | Apache-2.0 | Chromium/Firefox/WebKit that actually run on NixOS |

---

## `/web` — runtime dependencies

| Package | Version | Licence | Why we need it | Used by |
|---|---|---|---|---|
| next | 16.3.8 | MIT | App Router, server components, route handlers | everyone |
| react | 19.2.8 | MIT | UI runtime | everyone |
| react-dom | 19.2.8 | MIT | UI runtime | everyone |
| @supabase/supabase-js | 2.117.2 | MIT | all DB reads/writes from `/web` | Ola `lib/supabase.ts` |
| radix-ui | 1.6.7 | MIT | accessible primitives behind shadcn (focus trap, roving tabindex) | Hania, Jakub |
| lucide-react | 1.51.0 | ISC | icon set used by shadcn + `lib/categories.ts` | Hania, Ola |
| class-variance-authority | 0.7.1 | Apache-2.0 | component variant API used by shadcn | Hania |
| cn | 0.4.0 | MIT | `cn()` class merge helper re-exported by `lib/utils.ts` | Hania |
| tw-animate-css | 1.4.0 | MIT | Tailwind v4 animation utilities for shadcn | Hania |
| sonner | 2.0.8 | MIT | toast notifications | Jakub |
| next-themes | 0.4.6 | MIT | installed by shadcn; may back the contrast toggle | Ola, Hania |
| recharts | 3.10.1 | MIT | `/admin/trendy` bar chart (always beside a table) | Jakub |
| leaflet | 1.9.4 | BSD-2-Clause | `/wyzwania` powiat map (P2, always beside a table) | Hania |
| resend | 6.32.0 | MIT | transactional email from `app/api/notify/route.ts` | Jakub |

## `/web` — dev dependencies

| Package | Version | Licence | Why we need it |
|---|---|---|---|
| typescript | 5.9.3 | Apache-2.0 | types |
| tailwindcss | 4.3.3 | MIT | styling |
| @tailwindcss/postcss | 4.3.3 | MIT | Tailwind v4 PostCSS plugin |
| eslint | 9.39.5 | MIT | linting |
| eslint-config-next | 16.3.8 | MIT | Next.js lint rules |
| eslint-plugin-jsx-a11y | 6.10.2 | MIT | **full** WCAG rule set (AGENTS.md §7) |
| shadcn | 4.21.1 | MIT | CLI to add/update `components/ui/*` |
| @types/node, @types/react, @types/react-dom, @types/leaflet | — | MIT | type definitions |

## Root — `scripts/seed.ts`

| Package | Version | Licence | Why |
|---|---|---|---|
| @supabase/supabase-js | 2.117.2 | MIT | upserts Klaudia's `/data/seed/*.json` |
| tsx | 4.23.15 | MIT | runs the TS seed script directly |
| dotenv | 17.2.3 | MIT | loads the root `.env` |
| typescript, @types/node | 5.x / 20.x | Apache-2.0 / MIT | types |

Run with `nix-shell --run 'npm run seed'`.

## `/tests` — Playwright (owner: Sylwia)

| Package | Version | Licence | Why |
|---|---|---|---|
| @playwright/test | **1.59.1 (exact)** | Apache-2.0 | a11y + smoke tests |
| @axe-core/playwright | 4.13.0 | MPL-2.0 ⚠ | axe WCAG scanning |
| axe-core (transitive) | 4.x | MPL-2.0 ⚠ | the axe engine itself |

⚠ **`@axe-core/playwright` and `axe-core` are MPL-2.0**, outside the MIT/Apache/BSD policy. It is a
**test-only dev dependency**: it is never imported by `/web` and never ships to users, so no
MPL code is distributed in the submitted product. MPL-2.0 is file-level copyleft and we do not
modify its files. Flagged here so the decision is on the record — raise it with the mentors if
they want zero non-permissive licences anywhere in the repo.

**Do not bump `@playwright/test`.** It is pinned exactly because the browsers come from nixpkgs
`playwright-driver` 1.59.1, which ships `chromium-1217`. Playwright 1.63 looks for
`chromium-1243` and dies with *"Executable doesn't exist"*. Never run `npx playwright install`
— those downloaded binaries cannot run on NixOS.

## `/ai` — Python (owner: Janek)

Empty so far. Janek adds `requirements.txt` and lists packages + licences here.

---

## Decisions and gotchas

### `react-leaflet` was removed — licence violation
`react-leaflet@5` is **Hippocratic-2.1**, an ethical-source licence that is neither
MIT/Apache/BSD nor OSI-approved, so it breaks AGENTS.md §3 and would be a problem in the
copyright agreement. It is uninstalled. `leaflet` itself is BSD-2-Clause and stays.
**Hania:** if the `/wyzwania` map happens (it is P2), initialise Leaflet imperatively in a
`useEffect` inside a `"use client"` component instead of using React wrapper components. The
map needs a table alternative with the same data regardless (AGENTS.md §7), so the table is the
P0 and the map is pure bonus.

### Tailwind v4 — there is no `tailwind.config.ts`
Tailwind 4 is CSS-first. `agents/hania.md` mentions `tailwind.config.*`; that file does not
exist and should not be created. The theme lives in [web/app/globals.css](web/app/globals.css):

- colours: `:root { --background: … }` plus the `@theme inline { --color-background: var(--background) }` map
- high contrast: add `@custom-variant hc (&:is([data-contrast="high"] *))` and a
  `[data-contrast="high"] { … }` block overriding the same variables
- font scaling: `[data-font="125"] { font-size: 125% }` on `html`, and use `rem` everywhere

### Font subsets
`next/font` needs `subsets: ["latin", "latin-ext"]` or Polish diacritics (ą ć ę ł ń ó ś ź ż)
render from a fallback font. The generated scaffold had `["latin"]` only; fixed in
[web/app/layout.tsx](web/app/layout.tsx). Keep `latin-ext` when swapping the font.

The font CSS variable must be named `--font-sans` — `globals.css` maps exactly that name in
`@theme inline`. Renaming it silently breaks all typography.

### `npm audit`: 9 high findings, all accepted
All 9 trace to one advisory, [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
(`braces` stack exhaustion), reached only through **dev-only** tooling —
`eslint-config-next` → `@next/eslint-plugin-next` → `fast-glob` → `micromatch` → `braces`,
and the same chain inside the `shadcn` CLI. No browser or server bundle includes it, and the
attack needs a hostile glob pattern in our own lint config. `npm audit fix --force` "fixes" it
by downgrading to `eslint-config-next@14` / `shadcn@1`, which is worse. Not fixing.

### `npm warn allow-scripts`
npm 11 blocks postinstall scripts by default. `unrs-resolver` (ESLint resolver) and `esbuild`
(via `tsx`) are blocked. Both were tested and work fine without their postinstall, so leave
them blocked — it is the safer default. Do not run `npm approve-scripts`.
