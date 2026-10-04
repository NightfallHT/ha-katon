"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "../../_lib/supabase";
import { isAdmin } from "../../_lib/guard";
import { reembed } from "../../_lib/ai";

export type InnovationValues = {
  title: string;
  summary: string;
  description: string;
  category: string;
  tags: string;
  video_url: string;
  published: boolean;
};

// `saved` lets the form reset its "changed since last save" baseline without an
// effect: the button goes back to disabled the moment the write succeeds.
export type EditResult = { ok: boolean; message: string; saved?: InnovationValues };

export async function saveInnovation(id: string, _prev: EditResult | null, formData: FormData): Promise<EditResult> {
  const values: InnovationValues = {
    title: String(formData.get("title") ?? "").trim(),
    summary: String(formData.get("summary") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    category: String(formData.get("category") ?? "inne"),
    tags: String(formData.get("tags") ?? "").trim(),
    video_url: String(formData.get("video_url") ?? "").trim(),
    published: formData.get("published") === "on",
  };
  try {
    if (!(await isAdmin())) throw new Error("Brak uprawnień.");
    if (!values.title || !values.summary) throw new Error("Tytuł i krótki opis są wymagane.");
    const tags = values.tags.split(",").map((t) => t.trim()).filter(Boolean);
    const { error } = await adminDb()
      .from("innovations")
      .update({
        title: values.title,
        summary: values.summary,
        description: values.description || null,
        category: values.category,
        tags,
        video_url: values.video_url || null,
        published: values.published,
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
    const ok = await reembed();
    revalidatePath("/admin/biblioteka");
    revalidatePath("/biblioteka");
    return {
      ok: true,
      message: ok ? "Zapisano. Dopasowania zostały odświeżone." : "Zapisano. Dopasowania odświeżą się później (usługa AI jest niedostępna).",
      saved: values,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    if (message.includes("Brak konfiguracji")) {
      return { ok: false, message: "Zapis wymaga podłączonej bazy ROPS. W tym demo karta jest przykładowa." };
    }
    return { ok: false, message: message || "Coś poszło nie tak." };
  }
}
