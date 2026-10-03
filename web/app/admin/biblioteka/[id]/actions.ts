"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "../../_lib/supabase";
import { isAdmin } from "../../_lib/guard";
import { reembed } from "../../_lib/ai";

export type EditResult = { ok: boolean; message: string };

export async function saveInnovation(id: string, _prev: EditResult | null, formData: FormData): Promise<EditResult> {
  try {
    if (!(await isAdmin())) throw new Error("Brak uprawnień.");
    const title = String(formData.get("title") ?? "").trim();
    const summary = String(formData.get("summary") ?? "").trim();
    if (!title || !summary) throw new Error("Tytuł i krótki opis są wymagane.");
    const tags = String(formData.get("tags") ?? "").split(",").map((t) => t.trim()).filter(Boolean);
    const video = String(formData.get("video_url") ?? "").trim();
    const { error } = await adminDb()
      .from("innovations")
      .update({
        title,
        summary,
        description: String(formData.get("description") ?? "").trim() || null,
        category: String(formData.get("category") ?? "inne"),
        tags,
        video_url: video || null,
        published: formData.get("published") === "on",
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
    const ok = await reembed();
    revalidatePath("/admin/biblioteka");
    revalidatePath("/biblioteka");
    return { ok: true, message: ok ? "Zapisano. Dopasowania zostały odświeżone." : "Zapisano. Dopasowania odświeżą się później (usługa AI jest niedostępna)." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Coś poszło nie tak." };
  }
}
