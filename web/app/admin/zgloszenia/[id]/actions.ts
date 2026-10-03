"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "../../_lib/supabase";
import { isAdmin } from "../../_lib/guard";

const AI_URL = process.env.NEXT_PUBLIC_AI_URL;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export type ActionResult = { ok: boolean; message: string };

async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("Brak uprawnień.");
}

function fail(e: unknown): ActionResult {
  return { ok: false, message: e instanceof Error ? e.message : "Coś poszło nie tak. Spróbuj ponownie." };
}

async function ai<T>(path: string, body?: unknown): Promise<T> {
  if (!AI_URL) throw new Error("Brak adresu usługi AI (NEXT_PUBLIC_AI_URL).");
  const res = await fetch(`${AI_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Usługa AI nie odpowiedziała. Spróbuj za chwilę.");
  return res.json() as Promise<T>;
}

export async function enrichSubmission(id: string, _prev: ActionResult | null): Promise<ActionResult> {
  try {
    await requireAdmin();
    const db = adminDb();
    const { data, error } = await db.from("submissions").select("title,payload").eq("id", id).single();
    if (error || !data) throw new Error("Nie znaleziono zgłoszenia.");
    const text = [data.title, ...Object.values((data.payload ?? {}) as Record<string, unknown>).filter((v) => typeof v === "string")].join("\n");
    const out = await ai<{ summary: string; tags: string[]; category: string }>("/admin/enrich", { text });
    const upd = await db.from("submissions").update({ ai_summary: out.summary, ai_tags: out.tags, ai_category: out.category }).eq("id", id);
    if (upd.error) throw new Error(upd.error.message);
    revalidatePath(`/admin/zgloszenia/${id}`);
    return { ok: true, message: "Podsumowanie AI zostało zapisane." };
  } catch (e) {
    return fail(e);
  }
}

export async function updateStatus(id: string, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const status = String(formData.get("status") ?? "");
    if (!["nowe", "w_ocenie", "zaakceptowane", "odrzucone"].includes(status)) throw new Error("Nieprawidłowy status.");
    const { error } = await adminDb().from("submissions").update({ status }).eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath(`/admin/zgloszenia/${id}`);
    revalidatePath("/admin/zgloszenia");
    return { ok: true, message: "Status został zapisany." };
  } catch (e) {
    return fail(e);
  }
}

export async function sendReply(id: string, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const body = String(formData.get("body") ?? "").trim();
    if (!body) throw new Error("Wpisz treść odpowiedzi.");
    const { error } = await adminDb().from("messages").insert({ submission_id: id, sender: "admin", body });
    if (error) throw new Error(error.message);
    // Email is best effort: a missing Resend key must not break the demo.
    try {
      await fetch(`${SITE_URL}/api/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "admin_reply", submission_id: id }),
      });
    } catch {
      /* ignore */
    }
    revalidatePath(`/admin/zgloszenia/${id}`);
    return { ok: true, message: "Odpowiedź została wysłana." };
  } catch (e) {
    return fail(e);
  }
}

export async function publishToLibrary(id: string, _prev: ActionResult | null): Promise<ActionResult> {
  try {
    await requireAdmin();
    const db = adminDb();
    const { data: s, error } = await db.from("submissions").select("*").eq("id", id).single();
    if (error || !s) throw new Error("Nie znaleziono zgłoszenia.");
    if (!["idea", "good_practice"].includes(s.type)) throw new Error("Do Biblioteki można opublikować tylko pomysł lub dobrą praktykę.");
    if (s.innovation_id) throw new Error("To zgłoszenie jest już opublikowane.");
    const p = (s.payload ?? {}) as Record<string, string>;
    const { data: inn, error: e2 } = await db
      .from("innovations")
      .insert({
        title: s.title,
        summary: s.ai_summary || p.problem || s.title,
        description: [p.problem, p.solution].filter(Boolean).join("\n\n"),
        category: s.ai_category || "inne",
        target_groups: p.target_group ? [p.target_group] : [],
        tags: s.ai_tags ?? [],
        stage: s.type === "good_practice" ? "wdrożona" : p.stage || "pomysł",
        region: p.location || "cała Małopolska",
        contact_org: s.author_name,
        published: true,
      })
      .select("id")
      .single();
    if (e2 || !inn) throw new Error(e2?.message ?? "Nie udało się utworzyć innowacji.");
    const e3 = await db.from("submissions").update({ status: "zaakceptowane", innovation_id: inn.id }).eq("id", id);
    if (e3.error) throw new Error(e3.error.message);
    let note = "";
    try {
      await ai("/admin/reembed");
    } catch {
      note = " Indeks dopasowań odświeży się po następnej aktualizacji.";
    }
    revalidatePath(`/admin/zgloszenia/${id}`);
    revalidatePath("/admin/zgloszenia");
    revalidatePath("/biblioteka");
    return { ok: true, message: `Opublikowano w Bibliotece.${note}` };
  } catch (e) {
    return fail(e);
  }
}
