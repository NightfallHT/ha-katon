"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { adminDb } from "../admin/_lib/supabase";

export type MyResult = { ok: boolean; message: string };

export async function setDemoEmail(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
  (await cookies()).set("demo_email", email, { path: "/", sameSite: "lax" });
  revalidatePath("/moje-zgloszenia");
}

export async function replyAsAuthor(submissionId: string, _prev: MyResult | null, formData: FormData): Promise<MyResult> {
  try {
    const email = (await cookies()).get("demo_email")?.value;
    if (!email) throw new Error("Najpierw podaj swój adres e-mail.");
    const body = String(formData.get("body") ?? "").trim();
    if (!body) throw new Error("Wpisz treść wiadomości.");
    const db = adminDb();
    // Only the author of the submission may reply.
    const { data: s } = await db.from("submissions").select("id").eq("id", submissionId).eq("author_email", email).maybeSingle();
    if (!s) throw new Error("Nie znaleziono Twojego zgłoszenia.");
    const { error } = await db.from("messages").insert({ submission_id: submissionId, sender: "author", body });
    if (error) throw new Error("Nie udało się wysłać wiadomości.");
    revalidatePath("/moje-zgloszenia");
    return { ok: true, message: "Wiadomość została wysłana." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Coś poszło nie tak. Spróbuj ponownie." };
  }
}
