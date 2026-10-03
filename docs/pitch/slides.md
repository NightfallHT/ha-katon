# Slajdy HubMI (max 10) — szkic na PDF

Sylwia + Klaudia. Jedna myśl na slajd, duże litery, zrzuty z live. Zgodne z `docs/content/flows.md`.

Wizualnie: tło `#F3EFE8`, tekst `#142033`, brand `#0F3D6E`, akcent koralowy `#B83A12` (kontrast 4.5:1 z białym). Font Atkinson Hyperlegible. CTA w kształcie pigułki, karty z cienkim paskiem gradientu.

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
- Axe WCAG 2.1 AA: **0 naruszeń** na kluczowych stronach (3 tryby). Szczegóły: `tests/report.md`.

## 9. Architektura i koszt
Next.js (Vercel) + FastAPI (Render) + Supabase EU.  
Tabela: `docs/pitch/koszty.md` — hosting **~190–270 zł/mies.**, z czasem ROPS **~1,5 tys. zł/mies.**

## 10. Roadmap i zespół
Logowanie, RLS, prawdziwe dane ROPS.  
Zespół: Ola, Hania, Jakub, Janek, Klaudia, Sylwia.

Middleman (wójt → PDF usługi) — slajd niepotrzebny, chyba że zostanie 30 s w wideo.
