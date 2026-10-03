"use server";

import { adminDb } from "../admin/_lib/supabase";

export type ContactResult = { ok: boolean; message: string };

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export async function sendContact(_prev: ContactResult | null, formData: FormData): Promise<ContactResult> {
  try {
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();
    const page = String(formData.get("page") ?? "").trim();
    if (!name) throw new Error("Wpisz swoje imię.");
    if (!isEmail(email)) throw new Error("Wpisz poprawny adres e-mail, na który mamy odpowiedzieć.");
    if (!message) throw new Error("Napisz, w czym możemy pomóc.");
    const { data, error } = await adminDb()
      .from("submissions")
      .insert({
        type: "contact",
        title: message.length > 60 ? `${message.slice(0, 57)}…` : message,
        author_name: name,
        author_email: email,
        payload: { message, ...(page ? { page } : {}) },
      })
      .select("id")
      .single();
    if (error || !data) throw new Error("Nie udało się wysłać wiadomości. Spróbuj ponownie za chwilę.");
    try {
      await fetch(`${SITE_URL}/api/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "new_submission", submission_id: data.id }),
      });
    } catch {
      /* email is best effort */
    }
    return { ok: true, message: "Dziękujemy! Wiadomość trafiła do pracowników ROPS. Odpowiemy w ciągu 2 dni roboczych na podany adres e-mail." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Coś poszło nie tak. Spróbuj ponownie." };
  }
}
