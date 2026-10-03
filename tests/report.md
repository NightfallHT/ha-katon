# Accessibility test report — HubMI (Sylwia)

**Date:** 2026-10-03  
**Owner of this file:** Sylwia (`/tests`)  
**Audience:** Ola (triage), then page owners from `AGENTS.md` §4.

## How to run

```bash
cd tests
npm install
npx playwright install chromium
# BASE_URL = live Vercel URL from Ola
set BASE_URL=https://REPLACE.vercel.app
npm test
```

Axe tags: `wcag2a, wcag2aa, wcag21a, wcag21aa`.  
Modes per route: default, `data-contrast="high"`, `data-font="150"`.  
Role cookie set per route (`mieszkaniec` / `ngo` / `gmina` / `admin`).

## Status (Saturday 16:15)

Live `BASE_URL` is not in the repo yet — `/web` is still Ola's bootstrap. Specs are in place and will fail until the shell exists. **Do not treat red CI as product bugs until the first Vercel URL is shared.**

Re-run after the 20:00 matchmaking gate and after the Sunday 01:00 “every module clickable” gate. Final violation count + Lighthouse accessibility score go on **slide 8**.

## Expected selectors (from `/docs/content/flows.md`)

If a test fails on “locator not found”, the page owner should add the selector rather than weakening the test.

| Element | Owner | Selector |
|---|---|---|
| Skip link, `#main`, role switcher, font/contrast toggles, home `#problem` | Ola | `a[href="#main"]`, `#main`, `#problem` |
| Results `h1#wyniki` focused after match | Ola | `h1#wyniki` |
| Innovation cards, Kreator wizard fields | Hania | `#problem`, `#solution`, `#target_group` |
| Help bot dialog (focus trap, Esc) | Jakub | `button` name /pomoc/, `[role=dialog]` |
| Admin submissions table | Jakub | `table` on `/admin/zgloszenia` |

## Violations

Grouped by page → owner. Fill after the first green-enough deploy.

### `/` — Ola (shell)

| Rule | Impact | Fix |
|---|---|---|
| — | — | Waiting for live page |

### `/dopasuj` — Ola

| Rule | Impact | Fix |
|---|---|---|
| — | — | Waiting for live page |

### `/biblioteka`, `/biblioteka/[id]`, `/wyzwania`, `/materialy`, `/kreator` — Hania

| Rule | Impact | Fix |
|---|---|---|
| — | — | Waiting for live page |

### `/kontakt`, `/moje-zgloszenia`, `/admin*` — Jakub

| Rule | Impact | Fix |
|---|---|---|
| — | — | Waiting for live page |

### `/middleman` — Ola

| Rule | Impact | Fix |
|---|---|---|
| — | — | Waiting for live page |

## Keyboard & smoke

| Spec | Result | Notes |
|---|---|---|
| Skip link | pending | |
| Home → results heading focused | pending | |
| Help-bot trap + Esc | pending | |
| Kreator → admin inbox | pending | |
| 320 px no horizontal scroll | pending | `/`, `/dopasuj`, `/biblioteka`, `/kreator`, `/admin` |

## Slide 8 numbers (fill Sunday morning)

- Axe violations (default / high contrast / large font): **_ / _ / _**
- Lighthouse accessibility: **_**
- Features to list: skip link, role switcher, font 100/125/150, high contrast, keyboard matchmaking, Wyjaśnij prościej, captions/alt, table alternative for charts.

## Message to Ola

Sylwia: `/tests` Playwright + axe is ready. Please paste `BASE_URL` (Vercel) into the team chat. I will run the suite, dump real violations into this file, and assign each to the page owner with a one-line fix. Do not change the API contract for tests — only add the selectors in `flows.md` if missing.
