# Flowy demo + pomysły UI (Sylwia → Hania)

Handoff na makiety Figma i paletę. Jedna główna akcja na ekran — jury i osoby z niepełnosprawnościami nie gubią się w opcjach.

Główna obietnica: **zrozumieć, z czego mogę skorzystać w Małopolsce** (innowacje, bazy wiedzy, linki do źródeł) albo **zgłosić własny pomysł / wniosek**, gdy jest nabór.

## Paleta i typografia (propozycja do uzgodnienia)

Ciepły, regionalny, zaufany. Głęboki granat + ciepły bursztyn. Hania wkleja to do `globals.css` (normal + `[data-contrast="high"]`).

| Token | Normal | High contrast | Rola |
|---|---|---|---|
| `--bg` | `#F3EFE8` | `#000000` | tło strony |
| `--surface` | `#FFFFFF` | `#000000` | karty |
| `--text` | `#142033` | `#FFFFFF` | treść |
| `--muted` | `#3D4A5C` | `#FFE600` | pomocniczy tekst (nie sam szary) |
| `--brand` | `#0F3D6E` | `#FFE600` | nagłówki, nav, focus |
| `--accent` | `#B83A12` | `#FFE600` | CTA, „Dlaczego to pasuje” |
| `--border` | `#4A5A6E` | `#FFFFFF` | obramowania ≥ 3:1 |
| `--focus` | `#0F3D6E` | `#FFE600` | `focus-visible:ring-2` |

- Font: **Atkinson Hyperlegible** (Google Fonts), fallback `system-ui`. Baza **18px**, `line-height: 1.6`, wszędzie `rem`.
- Skala: `[data-font="125"]` → `html { font-size: 125% }`, `[data-font="150"]` → `150%`.
- Przyciski min. **44×44 px**. Nie używać koloru jako jedynego sygnału (chip kategorii ma tekst).
- Dla niedowidzących: wysoki kontrast i duża czcionka w nagłówku, od razu widoczne. Dla niedosłyszących: wszystko da się zrobić tekstem (mikrofon tylko opcjonalny, nigdy jedyna droga).

Pięć klatek Figma (Hania rysuje): home (wyszukaj, co jest dla mnie), wyniki `/dopasuj` z linkami do baz, karta `/biblioteka/[id]`, nabory + Kreator wniosku, admin: dodaj nabór / pozycję do zasobnika.

---

## Persona 1 — Pani Halina (niedowidzi albo niedosłyszy)

Cel: sprawdzić, **z jakich innowacji w Małopolsce może skorzystać** — co jest dla niej dostępne. Strona musi być czytelna przy słabym wzroku. Wyszukiwarka ma **zrozumieć** jej słowa i odesłać do zasobów wiedzy albo konkretnych linków z baz (Biblioteka Innowacji, materiały, `source_url`).

Rola cookie: `mieszkaniec`.

| # | Ekran | Jedna główna akcja |
|---|---|---|
| 0 | Dowolny — przełączniki a11y w nagłówku | Włączyć **dużą czcionkę** i/lub **wysoki kontrast** (zostają na kolejnych stronach) |
| 1 | `/` — „Czego szukasz? Co jest dla Ciebie?” | Wpisać własnymi słowami (albo, jeśli woli, nagrać) i wcisnąć **Szukaj** |
| 2 | `/dopasuj` — 3–5 trafień + „Dlaczego to pasuje” | Otworzyć **pierwszą kartę**; AI mówi po prostu, że zrozumiało np. „wsparcie dla seniorek / niedowidzenie” |
| 3 | `/biblioteka/[id]` — opis łatwym językiem | Przeczytać, **co to daje jej** + otworzyć **link do źródła / bazy** |
| 4 | Z tej karty albo z wyników | Wejść w **więcej w zasobniku** (`/biblioteka?category=niepelnosprawnosc` lub `/materialy`) |
| 5 | Widget pomocy (dialog, tekst) | Zapytać „gdzie to jest u mnie w gminie?”; zamknąć **Esc** |

Demo input (do cache’u Janka):  
„Słabo widzę. Chcę wiedzieć, z jakich innowacji w Małopolsce mogę skorzystać. Pokaż mi to, co jest dla osób takich jak ja.”

Wariant (niedosłyszy, bez mikrofonu): to samo, tylko pisze. Napisy / tekst zamiast dźwięku.

---

## Persona 2 — NGO (lokalne stowarzyszenie)

Cel: zobaczyć **aktualne nabory / projekty z UE**, pod które może wymyślić innowację i **złożyć wniosek**.

Rola cookie: `ngo`.

| # | Ekran | Jedna główna akcja |
|---|---|---|
| 1 | `/wyzwania` albo kafelek na home **„Aktualne nabory”** | Otworzyć listę otwartych naborów (np. z UE / ROPS) |
| 2 | Karta naboru (`calls`, `is_open`) | Przeczytać, **na co można składać** i do kiedy |
| 3 | `/kreator` | **Złóż wniosek o grant** (albo najpierw **Zgłoś pomysł**, jeśli jeszcze nie ma fiszki) |
| 4 | Szkic wniosku (AI) | **Wygeneruj szkic** → poprawić sekcje i budżet |
| 5 | Regulamin + wyślij | Zaznaczyć regulamin i **wyślij wniosek** |
| 6 | E-mail z potwierdzeniem | Dostać szczegóły wniosku na adres podany w formularzu |

Przykład: nabór na innowacje dla osób z niepełnosprawnościami i wykluczonych cyfrowo → NGO składa wniosek o sąsiedzkie wsparcie asystenckie.

---

## Persona 3 — Pracownik ROPS

Cel: **dokładać aktualne projekty z UE**, z których można składać wnioski, oraz **poszerzać zasobnik wiedzy** o usprawnieniach dla osób wykluczonych (w tym z niepełnosprawnościami).

Rola cookie: `admin`.

| # | Ekran | Jedna główna akcja |
|---|---|---|
| 1 | `/admin` | Wejść w **Nabory** albo **Zasobnik** |
| 2 | Formularz naboru | **Dodać nabór** (nazwa, opis, deadline, budżet, link do regulaminu, `is_open`) |
| 3 | Zasobnik / publikacja | **Dodać lub opublikować** innowację, materiał albo dobrą praktykę (dla kogo, kategoria `niepelnosprawnosc` / `integracja_spoleczna`, link do bazy) |
| 4 | `/admin/zgloszenia` | Otworzyć wniosek NGO albo pomysł mamy |
| 5 | Karta zgłoszenia | **Odpowiedz** i ewentualnie **Opublikuj w Bibliotece** |
| 6 | `/admin/trendy` | Zobaczyć, że ludzie szukają wsparcia dla osób z niepełnosprawnościami |

To nie jest tylko „odpowiedz na mail”. ROPS **karmi platformę treścią**, żeby Halina i mama syna mieli co znaleźć.

---

## Persona 4 — Mama syna z niepełnosprawnością (osoba prywatna)

Cel: zobaczyć, **co w Małopolsce jest dla jej syna**; ewentualnie **sama zgłosić małą innowację** (nie musi być NGO).

Rola cookie: `mieszkaniec`.

| # | Ekran | Jedna główna akcja |
|---|---|---|
| 1 | `/` | Wpisać sytuację syna i **Szukaj** |
| 2 | `/dopasuj` | Otworzyć rozwiązanie **dla opiekunów / osób z niepełnosprawnościami** |
| 3 | `/biblioteka/[id]` + podobne | Sprawdzić, czy można z tego skorzystać; kliknąć **źródło** |
| 4 | (ścieżka B) `/kreator` | **Zgłoś pomysł** — mała innowacja od osoby prywatnej |
| 5 | Potwierdzenie | Odpowiedź ROPS przyjdzie na e-mail |

Demo input:  
„Mam syna z niepełnosprawnością. Jakie projekty i innowacje w Małopolsce mogą nam pomóc? Chcę też zgłosić mały pomysł z naszej gminy.”

Ta sama ścieżka wyszukiwania służy **osobom z niepełnosprawnościami**, które chcą same sprawdzić ofertę (nie tylko przez opiekuna): filtr / chip „dla mnie — niepełnosprawność”, kategoria `niepelnosprawnosc`, język prosty, kontrast.

---

## Persona 5 — Wójt (moduł zostaje w produkcie, nie jest osią jury)

Jeśli pokazujemy `/middleman`: gmina bierze innowację z biblioteki (np. asysta, transport) i dostaje szkic usługi. To dodatek, nie zamiast Haliny / mamy / NGO.

---

## 3 tanie, zapamiętywalne pomysły UI

1. **„Dlaczego to pasuje” + „Dla kogo”** — na karcie wyniku jedno zdanie z `/match.why` i jawna grupa (np. „osoby niedowidzące”, „opiekunowie”). Zero nowej logiki.
2. **Odsyłacz do bazy / źródła** — duży link „Zobacz w Bibliotece Innowacji” / materiał ROPS (`source_url`). Halina wychodzi z platformy do prawdziwego zasobu, nie zostaje na pustej fiszce.
3. **Nabory jak lista ogłoszeń** — na home i `/wyzwania`: „Możesz składać do …”, data, dla kogo. NGO i ROPS widzą to samo; ROPS może dodać pozycję z panelu.

Bonus a11y (slajd 8): duża czcionka, wysoki kontrast, **Wyjaśnij prościej**, wszystko klawiaturą, mikrofon tylko jako dodatek (Halina niedosłysząca pisze).

---

## Selektory pod testy (prośba do Oli / Hani / Jakuba)

Żeby Playwright nie zgadywał, trzymajcie te atrybuty:

| Element | Selektor |
|---|---|
| Skip link | `a[href="#main"]` |
| Pytanie na home | `#problem` (textarea) |
| Szukaj | `button[type="submit"]` w formularzu home / dopasuj |
| Nagłówek wyników | `h1#wyniki` (dostaje `tabIndex={-1}` i `.focus()`) |
| Link do źródła / bazy | `a[data-source="innovation"]` |
| Lista naborów | `[data-calls]` / linki do otwartych `calls` |
| Help bot trigger | `button[aria-label="Otwórz pomoc"]` |
| Help bot dialog | `[role="dialog"][aria-label="Pomoc"]` |
| Kreator: zgłoś pomysł | `a[href="/kreator/fiszka"]` albo przycisk „Zgłoś pomysł” |
| Kreator: wniosek | przycisk / link „Złóż wniosek o grant” |
| Pole problemu w kreatorze | `#problem` |
| Wysyłka fiszki | `button[type="submit"]` na ostatnim kroku |
| Admin: dodaj nabór | `a[href="/admin/nabory"]` albo formularz naboru |
| Admin lista zgłoszeń | `table` na `/admin/zgloszenia` |
| Toggles a11y | `html[data-contrast]`, `html[data-font]` |

---

## Co mamy vs czego potrzebujemy (sobota ~17:00)

**Mamy (nasze):** te flow, paletę, selektory, szkic slajdów i skryptu, Playwright + axe.

**Mamy (kod):** placeholder `/` — skip link, `lang="pl"`, jeden `h1`, `header`/`nav`/`main`/`footer`. FastAPI mocki Janka. Copy Klaudii w `docs/content/copy.md` (jeszcze stary ton „problem / dojazd do lekarza”).

**Nie ma jeszcze (blokuje demo i testy):**
| Potrzeba | Kto | Po co |
|---|---|---|
| Header: kontrast, A/A+/A++, przełącznik roli, pełne menu | Ola | Halina w ogóle wchodzi na stronę |
| Home: pole wyszukiwania + 3 kafelki (szukaj / nabory+kreator / …) | Ola | start Haliny i mamy |
| `/dopasuj` rozumie „dla mnie / niedowidzę / dla syna” + why + link do źródła | Ola + Janek | oś jury |
| `/biblioteka`, materiały, nabory | Hania | odesłanie do baz |
| Kreator pomysłu i wniosku | Hania | NGO i mama |
| Admin: dodać nabór i pozycję do zasobnika | Jakub | ROPS karmi treść |
| `#main` z `tabIndex={-1}` (skip link nie przenosi fokusu) | Ola | a11y, 20% punktacji |
| Seed: min. 5 innowacji pod niepełnosprawność + 1 otwarty nabór UE | Klaudia | wyszukiwarka ma co zwrócić |
| Live URL (Vercel) | Ola | testy Sylwii i wideo |
| Zgodność copy z tymi flow (nie tylko „samotność na wsi”) | Klaudia | jeden głos na slajdach i UI |
