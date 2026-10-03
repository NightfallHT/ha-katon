# Accessibility test report — HubMI (Sylwia)

**Date:** 2026-10-03, ~17:00  
**Owner:** Sylwia (`/tests`)  
**Audience:** Ola (triage), potem ownerzy z `AGENTS.md` §4.

Źródło prawdy scenariuszy: [`docs/content/flows.md`](../docs/content/flows.md).

## How to run

```bash
cd tests
npm install
npx playwright install chromium   # nie na NixOS — tam browsers z shell.nix
# lokalnie:
set BASE_URL=http://localhost:3000
npm test
# albo live Vercel, gdy Ola da URL
```

Axe: tagi `wcag2a, wcag2aa, wcag21a, wcag21aa`. Trzy tryby: default, `data-contrast="high"`, `data-font="150"`. Cookie `role` per route.

## Co już jest w kodzie (przegląd `/`, sobota)

Zrobione dobrze:
- `lang="pl"`
- skip link „Przejdź do treści” (`a[href="#main"]`) — jest pierwszym elementem
- jeden `h1` na home
- landmarky: `header`, `nav`, `main#main`, `footer`

Dziury, które testy już łapią albo złapią po dojściu stron:

| Problem | Owner | Fix |
|---|---|---|
| `#main` nie ma `tabIndex={-1}` — Enter na skip link **nie przenosi fokusu** | Ola | `tabIndex={-1}` na `<main>` (i ewentualnie `.focus()` niepotrzebne, jeśli przeglądarka honoruje hash) |
| Brak `data-contrast` / `data-font` i przycisków w headerze | Ola | task 3 shell; testy ustawiają atrybuty ręcznie, ale jury musi kliknąć |
| Font Geist, nie Atkinson; baza nie 18px | Hania | `globals.css` + `layout.tsx` TODO(hania) |
| Home bez pola `#problem` — Halina nie wyszuka | Ola | formularz → `/dopasuj?q=` |
| Wszystkie inne routy 404 | owner strony | testy **skipują** 404, nie fałszują zielonego |
| Brak HelpBota | Jakub | dialog, pułapka fokusu, Esc |
| Brak Vercel URL | Ola | `BASE_URL` do testów i wideo |
| Copy i seed jeszcze pod starą historię (sąsiedzi / lekarz) | Klaudia | wyrównać do niepełnosprawności + nabory UE |

## Violations (axe)

Pełny przebieg axe na wszystkich routach **czeka na pierwsze strony ≠ 404**. Na placeholderze `/` nie spodziewamy się twardych błędów kontrastu (czarny tekst na białym), ale skip-focus i brak skalowania to długi ogon WCAG, którego axe nie zawsze zliczy.

### `/` — Ola

| Rule | Impact | Fix |
|---|---|---|
| Skip link vs focus (klawiatura, nie axe) | serious | `tabIndex={-1}` na `#main` |
| Brak przełączników a11y | serious | kontrast + font w headerze |
| Brak wyszukiwarki | blocker demo | textarea `#problem` + submit |

### `/dopasuj` — Ola — **nie zbudowane**

Potrzeba: `h1#wyniki` z focusem po wynikach, „Dlaczego to pasuje”, „Dla kogo”, „Wyjaśnij prościej”, link źródła.

### `/biblioteka`, `/wyzwania`, `/materialy`, `/kreator` — Hania — **nie zbudowane**

Potrzeba: karty z grupą docelową, link `data-source`, nabory, kreator pomysłu i wniosku.

### `/kontakt`, `/moje-zgloszenia`, `/admin*` — Jakub — **nie zbudowane**

Potrzeba: ROPS dodaje nabór i wpis do zasobnika; tabela zgłoszeń; tracker; bot.

### `/middleman` — Ola — **nie zbudowane** (nie oś jury)

## Keyboard i smoke (oczekiwany wynik dziś)

| Spec | Result | Notes |
|---|---|---|
| Skip link widoczny po Tab | powinno przejść | link jest |
| Skip link → focus na `#main` | fail aż Ola doda tabindex | |
| Home → wyniki | skip | brak `#problem` |
| Help-bot trap + Esc | skip | brak bota |
| Kreator → admin | skip | 404 |
| 320 px bez poziomego scrolla na `/` | powinno przejść | layout max-w-5xl |

Demo input w testach (Halina):  
„Słabo widzę. Chcę wiedzieć, z jakich innowacji w Małopolsce mogę skorzystać.”

## Czego potrzebujemy, żeby Block B był „skończony”

1. Shell Oli (toggles + wyszukiwarka + skip focus) — wtedy prawdziwy axe na `/` i `/dopasuj`.
2. Jedna karta biblioteki + jeden otwarty nabór — smoke i 320 px na kluczowych stronach.
3. `BASE_URL` z Vercel.
4. Re-run; liczby na slajd 8.

Do tego czasu **nie obiecujemy** jury „0 naruszeń axe” — obiecujemy, że suite jest gotowy i że wiemy, co commitują inni.

## Slide 8 (placeholder)

- Axe: **n/d (strony nie istnieją)** / po re-runie: **_ / _ / _**
- Lighthouse a11y: **n/d**
- Lista cech do pokazania, gdy shell będzie: skip link, kontrast, 100/125/150, klawiatura, Wyjaśnij prościej, link do bazy, nabory.

## Wiadomość do Oli / Hani / Jakuba / Klaudii

Sylwia: flow i testy są pod **nowe** scenariusze (niedowidzenie, nabory UE, ROPS jako redaktor zasobnika, mama / osoba z niepełnosprawnością). Najdroższy brak na a11y to **header + `#main` tabindex + pole wyszukiwania**. Reszta testów skipuje 404, żeby nie robić szumu.
