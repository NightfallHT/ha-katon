# Accessibility test report — HubMI (Sylwia)

**Date:** 2026-10-03, ~18:40 (lokalnie, `http://localhost:3000`)  
**Owner:** Sylwia (`/tests`)  
**Audience:** Ola (triage), potem ownerzy z `AGENTS.md` §4.

Źródło prawdy: [`docs/content/flows.md`](../docs/content/flows.md).

## How to run

```bash
cd tests
npm install
# Windows: przeglądarki przez `npx playwright install chromium`
# NixOS: NIE instaluj przeglądarek — są w shell.nix
set BASE_URL=http://localhost:3000
npm test
```

Axe: `wcag2a, wcag2aa, wcag21a, wcag21aa`. Tryby: default, `data-contrast="high"`, `data-font="150"`.

## Wynik (desktop + 320 px)

| Pakiet | Wynik |
|---|---|
| Axe, 3 tryby, routy z 200 | **0 naruszeń** |
| `/biblioteka/[id]`, 3 tryby | **0 naruszeń** |
| 320 px: `/`, `/dopasuj`, `/biblioteka`, `/kreator`, `/admin` | **brak poziomego scrolla** |
| Skip link → `#main` | **pass** |
| Home → `#problem` → `/dopasuj` → `h1#wyniki` | **pass** |
| HelpBot na `/biblioteka`: dialog, trap Tab, Esc | **pass** |
| Kreator → admin | **skip** — lokalnie brak Supabase (insert nie trafia do tabeli) |
| `/admin/trendy` | **demo fallback** — strona nie pada bez bazy |
| Tester / ocena | **demo fallback** — przykładowe opinie + lokalny zapis bez bazy |

Lighthouse a11y: nie odpalany (DevTools); na slajd 8 idzie axe 0 na przetestowanych stronach.

## Co naprawiliśmy po pierwszym przebiegu

Axe łapał **color-contrast 3.97:1** na CTA: biały na `#E24C1F`. Akcent zmieniony na **`#B83A12`**. Dialog: „Zamknij”, target 44×44.

## Luki na demo (nie ruszam plików Oli)

| Problem | Owner | Fix |
|---|---|---|
| HelpBot nie siedzi w `layout.tsx` — nie ma go na `/` i `/dopasuj` | Ola + Jakub | wrzucić `<HelpBot />` (jest TODO) |

## Slide 8

- Skip link, kontrast, 100/125/150, klawiatura, „Wyjaśnij prościej”, 44×44
- Axe WCAG 2.1 AA: **0 naruszeń** na `/`, `/dopasuj`, `/biblioteka`, `/kreator`, `/kontakt`, `/admin`, `/middleman` (3 tryby)
- HelpBot: trap + Esc
- 320 px bez poziomego paska
