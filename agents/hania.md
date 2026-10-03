# Agent brief — Hania (visual design + knowledge & creator pages)

Read `AGENTS.md` first. You are the coding agent of **Hania**, frontend developer and visual designer. You own the
visual identity (theme), the knowledge base pages (module II) and the idea creator (module III). Hania knows web
development and some Figma — explain design decisions briefly and keep components simple.

## Your files
`/web/components/ui/*` (shadcn), `/web/app/globals.css`, `tailwind.config.*`, `/web/components/innovation-card.tsx`,
`/web/app/biblioteka/*`, `/web/app/wyzwania/*`, `/web/app/materialy/*`, `/web/app/kreator/*`.

## Tasks (in order)

### 1. Visual identity (by 16:15, together with Sylwia in Figma)
- Palette: warm, trustworthy, regional (e.g. deep blue + warm accent). Define as CSS variables in `globals.css` for
  **normal** and **high-contrast** (`[data-contrast="high"]`) themes. Verify every text/background pair ≥ 4.5:1 and borders ≥ 3:1.
- Font: one readable sans with Polish diacritics (e.g. Inter or Atkinson Hyperlegible from Google Fonts), base 18 px, line-height 1.6.
- Font scaling: `[data-font="125"]` / `[data-font="150"]` on `<html>` change the root font size; use `rem` everywhere.
- Figma: 5 key screens (home, matchmaking results, innovation detail, Kreator step, admin inbox) — these become the "makiety UX/UI" deliverable.
- Theme shadcn components to the palette; focus ring clearly visible in both themes; buttons min 44 px high.

### 2. InnovationCard + library (by 20:00 — matchmaking needs the card)
- `InnovationCard` props: `{innovation, why?: string, compact?: boolean}`. Shows image (with alt), category chip (text, not colour only),
  title (as heading link), summary, stage, rating stars (with text "4,5 z 5"), optional highlighted "Dlaczego to pasuje".
- `/biblioteka`: search box + filters (category, target group, stage) as accessible checkboxes/selects, results count announced
  in `aria-live`. Grid → single column on mobile.
- `/biblioteka/[id]`: full description, video embed (`<iframe title=…>`, text description below), contact org, similar innovations,
  and a slot for Jakub's `<TesterPanel innovationId=… />`.

### 3. Challenges & materials (by 22:00)
- `/wyzwania`: Małopolska social challenges from the `challenges` table — cards grouped by category with indicator values.
  P2 only: Leaflet map by powiat, always with the same data as a table below.
- `/materialy`: list of materials with type filter (raport, poradnik, film, canvas), downloadable Social Innovation Canvas.
- Each challenge links to "Zobacz rozwiązania" → `/biblioteka?category=…`.

### 4. Kreator pomysłów (by 01:00)
- `/kreator` landing: three clear choices — **Zgłoś pomysł (fiszka)**, **Podziel się dobrą praktyką**, **Złóż wniosek o grant**
  (the last one only when a `calls` row has `is_open = true`; otherwise "Nabór jest obecnie zamknięty" + date of next if known).
- **Fiszka wizard**: 4 short steps, one question per screen, progress "Krok 2 z 4", back/next buttons, data kept between steps:
  1. Jaki problem rozwiązujesz? 2. Na czym polega pomysł? 3. Dla kogo? 4. Na jakim etapie jest (pomysł / test / działa) + gdzie.
  Prefill `problem` from `?problem=` (coming from matchmaking).
  Side panel / collapsible: **AI assistant** chat (`kreatorAssist`), suggestions as buttons "Wstaw do formularza".
  Submit → insert into `submissions` (type `idea`) → call Jakub's `/api/notify` → confirmation page with link to "Moje zgłoszenia".
- **Good practice**: same wizard pattern, type `good_practice`.
- **Grant application**: pick call → fiszka summary → "Wygeneruj szkic wniosku" (`grantDraft`) → editable sections + editable budget
  table with live total and a warning when above `budget_max` → regulamin checkbox (link) → submit (type `grant_application`).
- All fields: visible labels, hints, inline text errors on blur, error summary at top on submit with links to fields.

## Don't
- Don't add animation libraries; subtle CSS transitions only, disabled under `prefers-reduced-motion`.
- Don't use colour as the only signal anywhere.
- Don't edit the shell or admin pages — ask Ola/Jakub.

## Status / TODO

Last updated: 2026-10-03 18:53
Currently working on: final visual and mobile polish

- [x] Visual identity, high-contrast theme, font scaling and themed UI controls
- [x] Innovation cards, library browser and innovation detail pages
- [x] Challenges and materials pages backed by the seed catalog
- [x] Kreator landing, idea/good-practice flow and grant application editor
- [x] AI assistant integration and printable Social Innovation Canvas
- [ ] **IN PROGRESS:** review key pages at 320 px, 150% font and high contrast
- [ ] Fix visual/accessibility issues reported by Sylwia without changing page ownership boundaries
- [ ] Prepare or hand off the five key visual frames/screenshots for the final presentation
- [ ] **BLOCKED:** final screenshots — waiting for the stable live Vercel URL
