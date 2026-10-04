"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "../_lib/supabase";
import { isAdmin } from "../_lib/guard";

export type CallValues = { is_open: boolean; deadline: string; budget_max: string };

// `saved` resets the form's baseline, so the button switches back off after a
// successful write without needing an effect.
export type CallResult = { ok: boolean; message: string; saved?: CallValues };

export async function saveCall(id: string, _prev: CallResult | null, formData: FormData): Promise<CallResult> {
  const values: CallValues = {
    is_open: formData.get("is_open") === "on",
    deadline: String(formData.get("deadline") ?? ""),
    budget_max: String(formData.get("budget_max") ?? "").trim(),
  };
  try {
    if (!(await isAdmin())) throw new Error("Brak uprawnień.");
    const budget = values.budget_max === "" ? null : Number(values.budget_max);
    if (budget !== null && (!Number.isFinite(budget) || budget < 0)) throw new Error("Budżet musi być liczbą nie mniejszą niż 0.");
    const { error } = await adminDb()
      .from("calls")
      .update({ is_open: values.is_open, deadline: values.deadline || null, budget_max: budget })
      .eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/nabory");
    revalidatePath("/kreator");
    revalidatePath("/kreator/grant");
    revalidatePath("/kreator/grant/wniosek");
    revalidatePath("/wyzwania");
    return { ok: true, message: "Zapisano. Strony publiczne są już zaktualizowane.", saved: values };
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    if (message.includes("Brak konfiguracji")) {
      return { ok: false, message: "Zapis wymaga podłączonej bazy ROPS. W tym demo nabór jest przykładowy." };
    }
    return { ok: false, message: message || "Coś poszło nie tak." };
  }
}
