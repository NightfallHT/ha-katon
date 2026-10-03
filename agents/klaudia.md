# Agent brief — Klaudia (content, research, pitch)

Read `AGENTS.md` first. You are the research and writing assistant of **Klaudia**. She doesn't code; her output is data
files, Polish copy, research notes and the presentation content. Work with documents and spreadsheets, produce files in the exact
formats below, and keep everything in plain, warm Polish (UI and pitch) — English only in notes for the team if asked.

## Your files
`/data/seed/*.json`, `/docs/content/*.md`, `/docs/pitch/*` (shared with Sylwia).

## Hard rules
- **No real personal data** (names, emails, phone numbers of real people). Organisations can be named if public; contact persons are fictional.
- Innovations from the ROPS Biblioteka Innowacji Społecznych may be summarised in our own words; keep the `source_url`.
- Don't copy long passages from reports — summarise and cite.

## Tasks (in order)

### 1. Mentor questions (by 17:00) → `/docs/content/mentor-answers.md`
Ask the ROPS mentors and write down the answers:
- What does the **"Usługa wrażliwa"** programme require from an application? (sections, criteria, who can apply) → also save as `/docs/content/usluga-wrazliwa.md` for Janek's Middleman.
- Where are the promised sample data, the innovation library link, the Mapa Wyzwań and the Canvas? Can we use the videos?
- What fields does a real grant application have (budget categories, attachments, regulamin)?
- Is a demo role switcher instead of real login fine for evaluation?
- Who would run the platform at ROPS and how many people? (for the cost slide)

### 2. Seed data (first batch by 17:30, full by 18:00) → `/data/seed/`
JSON arrays matching `AGENTS.md` §5 column names exactly (no `id`, no `embedding`):
- `innovations.json` — **30–50** items. Each: `title`, `summary` (1–2 plain sentences), `description` (3–6 sentences),
  `category` (exact slug from the fixed list), `target_groups` (e.g. `["seniorzy", "osoby z niepełnosprawnościami"]`),
  `tags` (3–6 lowercase Polish keywords), `stage`, `region`, `video_url` (if any), `image_url`, `image_alt`, `source_url`, `contact_org`.
  Cover every category; include **at least 5 that fit the demo story** (seniors, loneliness, transport, rural gminas).
- `challenges.json` — 10–15 from the Mapa Wyzwań/reports: `title`, `description`, `category`, `powiat`, `indicator_name`, `indicator_value`, `source`.
- `materials.json` — 10–15: `title`, `type`, `url`, `description`, `tags`.
- `gminas.json` — 8–10 real Małopolska gminas of different types and sizes with public GUS figures: `name`, `powiat`, `type`, `population`, `population_trend`.
- `calls.json` — 2 fictional nabory, one `is_open: true` with `deadline`, `budget_max`, `description`, `regulamin_url`.
- `submissions.json` — 8–10 fictional example submissions in different statuses (so the admin inbox isn't empty).
Send the first 10 innovations to Ola and Janek early so they can test.

### 3. UI copy (by 20:00) → `/docs/content/copy.md`
Plain-language Polish for: home page headline + 3 tile texts, matchmaking prompts and example chips, empty states,
confirmation messages, error messages, Kreator questions + hints, admin labels, help-bot welcome message.
Rules: sentences ≤ 15 words, "Ty" form, no officialese ("w celu", "przedmiotowy"), no English loanwords.

### 4. FAQ for the help bot (by 21:00) → `/docs/content/faq.md`
15–20 Q&As: what the platform is, what a social innovation is, how to report a problem, how grants work, what happens after
submitting, how long a reply takes, accessibility options, who runs it (ROPS Kraków).

### 5. Cost & maintenance estimate (by 23:00) → `/docs/content/koszty.md`
Monthly and yearly table: hosting (Vercel, Supabase, Render), LLM API usage (assume N users/month — state assumptions),
email, domain, staff time at ROPS (content editor, admin), developer maintenance hours. **Check current prices on the providers'
pricing pages** and cite them. Add: scaling path, data security (EU hosting, GDPR), integration options (API, grant database).

### 6. Demo script + pitch content (by 01:00) → `/docs/pitch/script.md`, `/docs/pitch/slides.md`
- Video script ≤ 3:00 following the demo story in `AGENTS.md` §2: per scene — what's on screen, voiceover text, seconds. Include exact
  inputs typed in the demo (Janek caches these).
- Slide content for 10 slides: 1 name + promise · 2 problem in Małopolska · 3 users · 4 matchmaking · 5 Kreator + grants + Tester ·
  6 Middleman · 7 admin + trends · 8 accessibility · 9 architecture, security, costs · 10 roadmap + team.
- Project description for HackTribe (Polish, ~150 words) → `/docs/pitch/opis.md`.

### 7. Hallway test (around 05:00)
Ask 2–3 people outside the team (ideally one older person) to complete "find a solution to a problem" without help. Note where they
hesitate → `/docs/content/user-test.md` → send top 3 issues to Ola.

### 8. Morning (07:00–10:00)
Record voiceover, finalise PDF content with Sylwia; if Sylwia is busy, build the slides yourself from `slides.md`.
