# Agent brief — Sylwia (UX, accessibility testing, presentation) — part-time

Read `AGENTS.md` first. You are the assistant of **Sylwia**, who is working on another task in parallel. Her work here comes in
**three self-contained blocks**; each must be finishable in one sitting and must never block anyone else. She knows Python best
but also other tech, comes up with UI ideas, writes automated tests and makes great presentations.

## Your files
`/tests/*`, `/docs/pitch/*` (shared with Klaudia), Figma (shared with Hania).

---

## Block A — UX flows (kickoff, ~1 h, with Hania)
Output: `/docs/content/flows.md` + Figma frames.
- Sketch the user flow for each persona in the demo story (Pani Halina, NGO, ROPS employee, wójt): screens and the one main action per screen.
- Propose 2–3 memorable UI ideas that cost little to build, e.g. "Dlaczego to pasuje" highlights on results, voice input on
  the home question, an easy-read "Wyjaśnij prościej" button, a status tracker like a parcel delivery for submissions.
- Agree with Hania on palette and type; hand off.

## Block B — Automated accessibility tests (any ~2 h, Saturday evening or night)
Output: `/tests` Playwright project + `/tests/report.md`.
- Setup: `npm init playwright@latest` in `/tests`, add `@axe-core/playwright`. `BASE_URL` env = the Vercel URL.
- `a11y.spec.ts`: for each route (`/`, `/dopasuj`, `/biblioteka`, one `/biblioteka/[id]`, `/wyzwania`, `/materialy`, `/kreator`,
  `/kontakt`, `/moje-zgloszenia`, `/middleman`, `/admin`, `/admin/zgloszenia`, `/admin/trendy`) run axe with tags
  `wcag2a, wcag2aa, wcag21a, wcag21aa` in **three modes**: default, `data-contrast="high"`, `data-font="150"`. Set role cookie per route.
- `keyboard.spec.ts`: home → type a problem → submit → results heading focused, using only the keyboard; skip link works; help-bot dialog opens, traps focus, closes with Esc.
- `smoke.spec.ts`: the demo story's happy path end to end (fill Kreator, submit, see it in `/admin`).
- Viewport 320 px check: no horizontal scroll on key pages.
- Write `report.md`: violations grouped by page and owner (see `AGENTS.md` §4), with the fix suggestion. Send it to Ola.
- Re-run after fixes; final numbers (violations count, Lighthouse accessibility score) go on slide 8.

## Block C — Presentation & video (Sunday ~07:00–09:30)
Inputs: Klaudia's `/docs/pitch/script.md`, `slides.md`, `opis.md`, Hania's Figma, screenshots from the live app.
- **PDF, max 10 slides**, Polish, same visual identity as the app. One idea per slide, real screenshots, large text.
  Slide 8 = accessibility evidence (test results + list of features). Slide 9 = architecture diagram + monthly cost table.
- **MP4 video, max 3:00**, 1080p: screen recording of the demo story with voiceover and Polish captions burned in. Show the
  high-contrast/large-font mode at the end. Check the final length < 3:00.
- Export: `/docs/pitch/HubMI.pdf`, `/docs/pitch/HubMI.mp4`. Hand to Ola for submission by 10:15.

## If time is short
Priority: Block C > Block B > Block A. Klaudia can build the slides from `slides.md` if Block C is at risk — tell her by 07:00.
