# Slajdy HubMI (max 10) — szkic na PDF

Sylwia + Klaudia. Jedna myśl na slajd, duże litery, zrzuty z live. Klaudia wstawia copy i liczby z `koszty.md`; Sylwia wstawia zrzuty + slajd 8 (a11y).

Wizualnie jak aplikacja: tło `#F7F1E8`, tekst `#1A2332`, brand `#1B3A6B`, akcent `#C45C26`. Font Atkinson Hyperlegible / Inter.

## 1. Nazwa i obietnica
**Hub Innowacji Społecznych**  
Małopolska: zgłoś problem → znajdź działające rozwiązanie → albo stwórz nowe.  
Zrzut: home z pytaniem „Z jakim problemem się mierzysz?”

## 2. Problem w Małopolsce
Seniorzy na wsi są sami. Nie dojadą do lekarza. Innowacje już są — trudno je znaleźć.  
(_Klaudia: 1–2 liczby z Mapy Wyzwań_)

## 3. Kto korzysta
Cztery osoby z demo: Halina (mieszkaniec), NGO, pracownik ROPS, wójt.  
Jeden ekran, jedna główna akcja — patrz `docs/content/flows.md`.

## 4. Dopasowanie
Halina mówi lub pisze. Dostaje 3 innowacje i zdanie **„Dlaczego to pasuje”**.  
Zrzut: `/dopasuj` z podświetlonym why.

## 5. Kreator + granty + tester
NGO zgłasza fiszkę w 4 krokach. Otwarty nabór → szkic wniosku. Halina testuje i ocenia.  
Zrzut: Kreator krok + panel testera.

## 6. Middleman
Wójt: innowacja + profil gminy → projekt usługi (PDF) pod Usługę wrażliwą.  
Zrzut: raport z checklistą.

## 7. Admin i trendy
ROPS: skrzynka zgłoszeń, odpowiedź, publikacja do biblioteki. Trend „samotność / gminy wiejskie”.  
Zrzut: `/admin/zgloszenia` + `/admin/trendy`.

## 8. Dostępność (Sylwia — liczby z testów)
- Skip link, klawiatura, widoczny focus  
- Wysoki kontrast + duża czcionka (100 / 125 / 150)  
- „Wyjaśnij prościej”, etykiety, 44×44  
- Axe (WCAG 2.1 AA): **_ naruszeń** · Lighthouse a11y: **_**  
Szczegóły: `tests/report.md`

## 9. Architektura i koszt
Next.js (Vercel) + FastAPI (Render) + Supabase EU + Resend.  
Tabela miesięczna z `docs/content/koszty.md`. RLS + prawdziwe logowanie na roadmapie.

## 10. Roadmap i zespół
Po hackathonie: logowanie, RLS, prawdziwe dane ROPS.  
Zespół: Ola, Hania, Jakub, Janek, Klaudia, Sylwia.
