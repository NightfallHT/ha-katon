# Koszty miesięczne (szkic na slajd 9)

Ceny z 3 października 2026, strony cenników dostawców. Kwoty w PLN, kurs roboczy **1 USD ≈ 4 zł**. Założenie MVP ROPS: **500 zapytań /dopasuj na miesiąc**, 1 redaktor treści, 1 admin.

| Pozycja | Plan | USD | zł / mies. | Źródło |
|---|---|---|---:|---|
| Front (Vercel) | Hobby (prototyp) / Pro przy produkcji | 0 / 20 | 0 / 80 | https://vercel.com/pricing |
| Baza (Supabase EU) | Pro + 1× Micro (kredyt w planie) | 25 | 100 | https://supabase.com/pricing |
| API `/ai` (Render) | Web 0.5 GB | ~7 | 28 | https://render.com/pricing |
| LLM (gpt-4o-mini) | 500 match + bot + kreator | ~15 | 60 | cennik OpenAI, rząd wielkości |
| E-mail (Resend) | darmowy próg demo | 0 | 0 | resend.com |
| Domena | .pl rozłożona na 12 mies. | — | 5 | rejestrator |
| **Hosting łącznie** | | | **~193** (Hobby) / **~273** (Vercel Pro) | |
| Czas ROPS (treści + admin) | 8 h × 80 zł | — | 640 | założenie |
| Dyżur deweloperski | 4 h × 150 zł | — | 600 | założenie |
| **Razem z ludźmi** | | | **~1,4–1,5 tys. zł / mies.** | |

Rocznie hosting: ok. **2,3–3,3 tys. zł**. Z ludźmi: ok. **17 tys. zł**.

Skalowanie: Vercel Pro, większy compute Supabase, osobny klucz LLM, RLS + logowanie (slajd 10).

Bezpieczeństwo: hosting UE (Supabase Frankfurt), brak prawdziwych danych w protototypie, GDPR na roadmapie.

Klaudia: popraw stawki godzinowe ROPS, gdy mentorzy odpowiedzą.
