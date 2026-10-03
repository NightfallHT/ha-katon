# Slajdy HubMI (max 10) — szkic na PDF

Sylwia + Klaudia. Jedna myśl na slajd, duże litery, zrzuty z live. Zgodne z `docs/content/flows.md`.

Wizualnie: tło `#F7F1E8`, tekst `#1A2332`, brand `#1B3A6B`, akcent `#C45C26`. Font Atkinson Hyperlegible.

## 1. Nazwa i obietnica
**Hub Innowacji Społecznych**  
Małopolska: zrozum, **z czego możesz skorzystać** — albo zgłoś pomysł / wniosek, gdy jest nabór.  
Zrzut: home „Czego szukasz? Co jest dla Ciebie?”

## 2. Problem
Innowacje i nabory już są. Osoba niedowidząca, mama syna z niepełnosprawnością, NGO — nie wiedzą, gdzie tego szukać.  
(_Klaudia: 1–2 liczby z Mapy Wyzwań / niepełnosprawność w Małopolsce_)

## 3. Kto korzysta
Halina (słaby wzrok / słuch) · mama / osoba z niepełnosprawnością · NGO przy naborze UE · ROPS, które **dokłada** nabory i wiedzę.  
Jeden ekran, jedna akcja.

## 4. Dopasowanie
Halina pisze (albo mówi). Dostaje 3 trafienia: **dlaczego pasuje**, **dla kogo**, **link do prawdziwej bazy**.  
Zrzut: `/dopasuj`.

## 5. Nabory + Kreator
NGO widzi otwarty projekt z UE i składa wniosek. Osoba prywatna może zgłosić mały pomysł.  
Zrzut: lista naborów + Kreator.

## 6. Zasobnik, nie pusta fiszka
Karta innowacji prowadzi do źródła ROPS / Biblioteki Innowacji. Materiały i usprawnienia dla osób wykluczonych.  
Zrzut: `/biblioteka/[id]` z linkiem „Zobacz w bazie”.

## 7. ROPS karmi platformę
Dodaje nabór, publikuje wpis do zasobnika, odpowiada na wnioski. Widać, czego ludzie szukają (niepełnosprawność).  
Zrzut: admin nabór + skrzynka.

## 8. Dostępność (Sylwia — liczby z testów)
- Duża czcionka, wysoki kontrast, skip link, klawiatura  
- Wszystko da się zrobić **tekstem** (mikrofon tylko dodatek)  
- „Wyjaśnij prościej”, 44×44, etykiety  
- Axe / Lighthouse: `tests/report.md` (dziś: suite gotowy, pełne liczby po shellu Oli)

## 9. Architektura i koszt
Next.js (Vercel) + FastAPI + Supabase EU.  
Tabela z `docs/content/koszty.md`, gdy Klaudia ją doda.

## 10. Roadmap i zespół
Logowanie, RLS, prawdziwe dane ROPS.  
Zespół: Ola, Hania, Jakub, Janek, Klaudia, Sylwia.

Middleman (wójt → PDF usługi) — slajd niepotrzebny, chyba że zostanie 30 s w wideo.
