"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "../app/admin/_lib/supabase";

export type TesterResult = { ok: boolean; message: string };

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function fail(e: unknown): TesterResult {
  return { ok: false, message: e instanceof Error ? e.message : "Coś poszło nie tak. Spróbuj ponownie." };
}

function localOk(kind: "signup" | "review"): TesterResult {
  if (kind === "signup") {
    return {
      ok: true,
      message: "Zapisaliśmy Cię na testy na tym komputerze. Gdy baza ROPS działa, zgłoszenie trafi do pracowników.",
    };
  }
  return { ok: true, message: "Dziękujemy za ocenę. Zapisaliśmy ją na tym komputerze." };
}

function isDemoFallback(e: unknown) {
  const text = e instanceof Error ? e.message : String(e);
  return (
    text.includes("Brak konfiguracji") ||
    text.includes("Nie znaleziono") ||
    text.includes("fetch") ||
    text.includes("Failed")
  );
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The catalog pages use slug ids from the seed JSON. Supabase rows have uuid ids, so match by title.
async function resolveInnovation(idOrSlug: string, title: string) {
  const db = adminDb();
  if (UUID.test(idOrSlug)) {
    const { data } = await db.from("innovations").select("id,title").eq("id", idOrSlug).maybeSingle();
    if (data) return data;
  }
  if (title) {
    const { data } = await db.from("innovations").select("id,title").eq("title", title).limit(1).maybeSingle();
    if (data) return data;
  }
  return null;
}

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export async function signUpToTest(innovationId: string, innovationTitle: string, _prev: TesterResult | null, formData: FormData): Promise<TesterResult> {
  try {
    const email = String(formData.get("email") ?? "").trim();
    const firstName = String(formData.get("first_name") ?? "").trim();
    const lastName = String(formData.get("last_name") ?? "").trim();
    if (!isEmail(email)) throw new Error("Wpisz poprawny adres e-mail.");
    if (!firstName) throw new Error("Wpisz imię.");
    if (!lastName) throw new Error("Wpisz nazwisko.");
    const db = adminDb();
    const inn = await resolveInnovation(innovationId, innovationTitle);
    const titleForSubmission = inn?.title ?? innovationTitle;
    if (!titleForSubmission) throw new Error("Nie znaleziono tej innowacji.");
    const { data: sub, error } = await db
      .from("submissions")
      .insert({
        type: "test_signup",
        title: `Zapis do testów: ${titleForSubmission}`,
        author_name: `${firstName} ${lastName}`,
        author_email: email,
        payload: {
          innovation_id: inn?.id ?? innovationId,
          first_name: firstName,
          last_name: lastName,
        },
      })
      .select("id")
      .single();
    if (error || !sub) throw new Error(error?.message ?? "Nie udało się zapisać zgłoszenia.");
    try {
      await fetch(`${SITE_URL}/api/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "new_submission", submission_id: sub.id }),
      });
    } catch {
      /* email is best effort */
    }
    return { ok: true, message: "Dziękujemy! Zapisaliśmy Cię na testy. Odezwiemy się e-mailem." };
  } catch (e) {
    if (isDemoFallback(e)) return localOk("signup");
    return fail(e);
  }
}

export async function submitReview(innovationId: string, innovationTitle: string, _prev: TesterResult | null, formData: FormData): Promise<TesterResult> {
  try {
    const rating = Number(formData.get("rating"));
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error("Wybierz ocenę od 1 do 5.");
    const feedback = String(formData.get("feedback") ?? "").trim();
    const occasion = String(formData.get("occasion") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const firstName = String(formData.get("first_name") ?? "").trim();
    const lastName = String(formData.get("last_name") ?? "").trim();
    if (!occasion) throw new Error("Napisz, przy jakiej okazji testowałeś tę inicjatywę.");
    if (!feedback) throw new Error("Napisz swoją ocenę.");
    if (!isEmail(email)) throw new Error("Wpisz poprawny adres e-mail.");
    if (!firstName) throw new Error("Wpisz imię.");
    if (!lastName) throw new Error("Wpisz nazwisko.");
    const db = adminDb();
    const inn = await resolveInnovation(innovationId, innovationTitle);
    if (!inn) throw new Error("Nie znaleziono tej innowacji w bazie. Ocena nie została zapisana.");
    innovationId = inn.id;
    const fullFeedback = `${feedback}\n\nOkazja: ${occasion}\nAutor: ${firstName} ${lastName}`;
    const ins = await db
      .from("reviews")
      .insert({
        innovation_id: innovationId,
        rating,
        feedback: fullFeedback,
        improvement: null,
        author_email: email,
      });
    if (ins.error) throw new Error(ins.error.message);
    const { data: all } = await db.from("reviews").select("rating").eq("innovation_id", innovationId);
    const ratings = (all ?? []).map((r) => r.rating as number);
    const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    const upd = await db
      .from("innovations")
      .update({ avg_rating: Math.round(avg * 10) / 10, ratings_count: ratings.length })
      .eq("id", innovationId);
    if (upd.error) throw new Error(upd.error.message);
    revalidatePath(`/biblioteka/${innovationId}`);
    return { ok: true, message: "Dziękujemy za ocenę!" };
  } catch (e) {
    if (isDemoFallback(e)) return localOk("review");
    return fail(e);
  }
}
