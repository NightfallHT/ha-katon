# Flowy demo + pomysły UI (Sylwia → Hania)

Handoff na makiety Figma (5 ekranów) i paletę. Jedna główna akcja na ekran — jury i seniorzy nie gubią się w opcjach.

## Paleta i typografia (propozycja do uzgodnienia)

Ciepły, regionalny, zaufany. Głęboki granat + ciepły bursztyn. Hania wkleja to do `globals.css` (normal + `[data-contrast="high"]`).

| Token | Normal | High contrast | Rola |
|---|---|---|---|
| `--bg` | `#F7F1E8` | `#000000` | tło strony |
| `--surface` | `#FFFFFF` | `#000000` | karty |
| `--text` | `#1A2332` | `#FFFFFF` | treść |
| `--muted` | `#3D4A5C` | `#FFFF00` | pomocniczy tekst (nie sam szary) |
| `--brand` | `#1B3A6B` | `#FFFF00` | nagłówki, nav, focus |
| `--accent` | `#C45C26` | `#FFFF00` | CTA, „Dlaczego to pasuje” |
| `--border` | `#5A6A7A` | `#FFFFFF` | obramowania ≥ 3:1 |
| `--focus` | `#1B3A6B` | `#FFFF00` | `focus-visible:ring-2` |

- Font: **Atkinson Hyperlegible** (Google Fonts), fallback `system-ui`. Baza **18px**, `line-height: 1.6`, wszędzie `rem`.
- Skala: `[data-font="125"]` → `html { font-size: 125% }`, `[data-font="150"]` → `150%`.
- Przyciski min. **44×44 px**. Nie używać koloru jako jedynego sygnału (chip kategorii ma tekst).

Pięć klatek Figma (Hania rysuje): home, wyniki `/dopasuj`, karta `/biblioteka/[id]`, Kreator krok 1, inbox `/admin/zgloszenia`.

---

## Persona 1 — Pani Halina, 70 lat (mieszkaniec)

Cel: opisać samotność sąsiadów i dojazd do lekarza → dostać 3 rozwiązania → przetestować jedno → zapytać bota.

Rola cookie: `mieszkaniec`.

| # | Ekran | Jedna główna akcja |
|---|---|---|
| 1 | `/` — pytanie „Z jakim problemem się mierzysz?” | Wpisać / nagrać problem i wcisnąć **Szukaj rozwiązań** |
| 2 | `/dopasuj` — wyniki + „Dlaczego to pasuje” | Otworzyć **pierwszą kartę** (nagłówek wyniku ma focus) |
| 3 | `/biblioteka/[id]` — opis prostym językiem | **Chcę przetestować** (TesterPanel) |
| 4 | Ten sam ekran — ocena | Oddać ocenę (radio 1–5) i wysłać |
| 5 | Widget pomocy (dialog) | Zadać pytanie, zamknąć **Esc** |

Demo input (do cache’u Janka):  
„Moi starsi sąsiedzi są sami i nie mają jak dojechać do lekarza. Mieszkamy na wsi.”

---

## Persona 2 — NGO (lokalne stowarzyszenie)

Cel: zgłosić pomysł w Kreatorze, przy otwartym naborze wygenerować szkic wniosku.

Rola cookie: `ngo`.

| # | Ekran | Jedna główna akcja |
|---|---|---|
| 1 | `/kreator` — trzy wybory | **Zgłoś pomysł (fiszka)** |
| 2 | Krok 1/4 — problem | Opisać problem (prefill z `?problem=` jeśli z matchmakingu) |
| 3 | Krok 2/4 — pomysł | Opisać rozwiązanie |
| 4 | Krok 3/4 — dla kogo | Wybrać grupę (np. seniorzy, gmina wiejska) |
| 5 | Krok 4/4 — etap i miejsce | Zapisać i **wyślij zgłoszenie** |
| 6 | Potwierdzenie | Otworzyć **Moje zgłoszenia** (tracker statusu) |
| 7 | (opcjonalnie) Wniosek o grant | **Wygeneruj szkic wniosku** → edycja → akceptacja regulaminu → wyślij |

---

## Persona 3 — Pracownik ROPS

Cel: mail → admin → odpowiedź → publikacja do biblioteki → trend samotność / gminy wiejskie.

Rola cookie: `admin`.

| # | Ekran | Jedna główna akcja |
|---|---|---|
| 1 | `/admin` — kafelki liczb | Wejść w **Nowe zgłoszenia** |
| 2 | `/admin/zgloszenia` — tabela | Otworzyć najnowsze zgłoszenie NGO |
| 3 | `/admin/zgloszenia/[id]` | **Odpowiedz** autorowi (plus „Uzupełnij przez AI”) |
| 4 | Ten sam ekran | **Opublikuj w Bibliotece** |
| 5 | `/admin/trendy` | Zobaczyć wzrost „samotność / gminy wiejskie” |

---

## Persona 4 — Wójt (gmina)

Cel: z innowacji zrobić projekt usługi (transport / wykluczenie) pod „Usługę wrażliwą”, PDF.

Rola cookie: `gmina`.

| # | Ekran | Jedna główna akcja |
|---|---|---|
| 1 | `/middleman` — wybór | Wybrać innowację + gminę wiejską |
| 2 | Czat Middleman | Odpowiadać na pytania AI (min. 3 tury) |
| 3 | Raport usługi | **Mam dość informacji — przygotuj projekt usługi** |
| 4 | Raport (przyczyny, koszt, checklista) | **Pobierz PDF** (`window.print`) |

---

## 3 tanie, zapamiętywalne pomysły UI

1. **„Dlaczego to pasuje”** — żółty/bursztynowy pasek na karcie wyniku, jedno zdanie z `/match.why`. Zero nowej logiki, duży efekt na jury.
2. **Mikrofon na home i `/dopasuj`** — Web Speech API `pl-PL`; jeśli brak wsparcia, przycisk ukryty. Halina mówi zamiast pisać.
3. **Tracker zgłoszenia jak paczka** — na `/moje-zgloszenia`: Nowe → W ocenie → Zaakceptowane / Odrzucone, duży tekst statusu + data. Jakub, jeden komponent listy kroków.

Bonus (już w regułach a11y, warto pokazać na slajdzie 8): przycisk **Wyjaśnij prościej** przy każdej odpowiedzi AI i na kartach wyników.

---

## Selektory pod testy (prośba do Oli / Hani / Jakuba)

Żeby Playwright nie zgadywał, trzymajcie te atrybuty:

| Element | Selektor |
|---|---|
| Skip link | `a[href="#main"]` |
| Pytanie na home | `#problem` (textarea) |
| Szukaj | `button[type="submit"]` w formularzu home / dopasuj |
| Nagłówek wyników | `h1#wyniki` (dostaje `tabIndex={-1}` i `.focus()`) |
| Help bot trigger | `button[aria-label="Otwórz pomoc"]` |
| Help bot dialog | `[role="dialog"][aria-label="Pomoc"]` |
| Kreator: zgłoś pomysł | `a[href="/kreator/fiszka"]` lub `button` o nazwie „Zgłoś pomysł” |
| Pole problemu w kreatorze | `#problem` |
| Wysyłka fiszki | `button[type="submit"]` na ostatnim kroku |
| Admin lista | `table` na `/admin/zgloszenia` |
| Toggles a11y | `html[data-contrast]`, `html[data-font]` |

---

## Co dalej

- Hania: Figma 5 ekranów + tokeny w CSS.
- Ola: skip link, focus na `h1` wyników, mikrofon, `data-*` na `<html>`.
- Jakub: tracker statusu + dialog bota (pułapka fokusu, Esc).
- Sylwia: testy w `/tests` (axe + klawiatura + smoke). Live `BASE_URL` od Oli.
