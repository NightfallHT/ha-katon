# Agent brief — Jakub (admin panel, tester, communication)

Read `AGENTS.md` first. You are the coding agent of **Jakub**. He has solid basic programming skills but says he "can't do
anything" — so: give him small, complete steps, explain what each file does in one line, prefer simple patterns
(server components + Supabase queries + plain forms), and tell him how to check it works after each step.
Pair with Ola for the first hour.

## Your files
`/web/app/admin/*`, `/web/app/kontakt/*`, `/web/app/moje-zgloszenia/*`, `/web/components/tester-panel.tsx`,
`/web/components/help-bot.tsx`, `/web/app/api/notify/route.ts`.

## Tasks (in order)

### 1. Admin inbox (by 20:00)
- `/admin` (visible for role `admin`; others see "Ta część jest dla pracowników ROPS" + switch link).
- Dashboard tiles: Nowe zgłoszenia (count), W ocenie, Opublikowane innowacje, Zapytania w tym tygodniu (from `needs`).
- `/admin/zgloszenia`: table of `submissions` — title, type (Polish label), author, date, status. Filter by status and type.
  A real `<table>` with `<th scope>`; status shown as text badge. Newest first.
- `/admin/zgloszenia/[id]`: full content (render `payload` fields with Polish labels), AI summary and tags
  (button "Uzupełnij przez AI" → `adminEnrich`, saves to `ai_summary`, `ai_tags`, `ai_category`),
  status select + save, message thread (`messages`) with a reply form.
  Reply → insert message (sender `admin`) + email to author via `/api/notify`.
  Button **"Opublikuj w Bibliotece"** (for idea/good_practice): creates an `innovations` row from the submission, sets status
  `zaakceptowane`, links `innovation_id`, then calls `/admin/reembed` so it is matchable immediately.
- **Done when**: you can take a fresh submission from "nowe" to "published" and find it in `/biblioteka` and via matchmaking.

### 2. Notifications `/api/notify` (by 21:00)
- `POST {type: 'new_submission' | 'admin_reply', submission_id}`.
- `new_submission` → email to `ADMIN_NOTIFY_EMAIL`: "Nowe zgłoszenie: <title>" + link to `/admin/zgloszenia/<id>`.
- `admin_reply` → email to author: "Odpowiedź ROPS w sprawie: <title>" + link to `/moje-zgloszenia`.
- Use Resend; if the key is missing, log and return ok (demo must not crash).
- Also show an in-app notification badge with the count of `nowe` in the admin nav.

### 3. Tester innowacji `<TesterPanel innovationId>` (by 23:00)
- Section "Przetestuj i oceń" on the innovation page:
  - "Chcę przetestować" → short form (motivation, email prefilled from `demo_email`) → submission type `test_signup`.
  - Rating: 5 radio buttons styled as stars (real radios, keyboard accessible, legend "Twoja ocena"), feedback textarea,
    "Co można poprawić?" textarea → insert `reviews`, update `avg_rating`/`ratings_count` on the innovation.
  - List of latest 3 reviews.
- Give Hania the import line to place it on `/biblioteka/[id]`.

### 4. Kontakt + Moje zgłoszenia (by 00:30)
- `/kontakt`: form (imię, e-mail, wiadomość, optional page) → submission type `contact` → notify admin. Confirmation text with expected reply time.
- `/moje-zgloszenia`: submissions where `author_email = demo_email` with status as a clear text step indicator
  (Wysłane → W ocenie → Decyzja) and the message thread; author can reply (sender `author`).

### 5. Help bot widget `<HelpBot />` (by 01:30)
- Floating button "Potrzebujesz pomocy?" (bottom right, labelled, keyboard reachable, doesn't cover content on mobile).
- Opens a dialog (shadcn `Dialog`: focus trapped, Esc closes, focus returns to the button). Messages in `aria-live` log.
- Calls `chat()` with `page = current pathname`. Show sources as links. If `handoff` → "Napisz do pracownika ROPS" → `/kontakt` prefilled.
- Give Ola the import for `layout.tsx`.

### 6. Admin extras (by 03:30)
- `/admin/nabory`: list `calls`, toggle `is_open` (this shows/hides the grant generator in the Kreator), edit deadline and budget.
- `/admin/biblioteka`: table of innovations with edit form (title, summary, description, category, tags, video, published toggle). Save → reembed.
- `/admin/trendy`: from `needs` — bar chart of queries per category (Recharts) **plus the same data as a table**, and list of
  latest 10 needs. Text summary at top: "Najczęściej zgłaszany problem w tym tygodniu: …".

### 7. QA (night shift, after 04:00)
- Click through the whole demo story (AGENTS.md §2) with keyboard only, then at 150% font + high contrast. Log bugs in the team chat with page + steps.

## Don't
- Don't modify the database schema — ask Ola. Don't touch other people's pages.
