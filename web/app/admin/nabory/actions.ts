"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "../_lib/supabase";
import { isAdmin } from "../_lib/guard";

export type CallResult = { ok: boolean; message: string };

export async function saveCall(id: string, _prev: CallResult | null, formData: FormData): Promise<CallResult> {
  try {
    if (!(await isAdmin())) throw new Error("Brak uprawnień.");
    const deadline = String(formData.get("deadline") ?? "");
    const budgetRaw = String(formData.get("budget_max") ?? "").trim();
    const budget = budgetRaw === "" ? null : Number(budgetRaw);
    if (budget !== null && (!Number.isFinite(budget) || budget < 0)) throw new Error("Budżet musi być liczbą nie mniejszą niż 0.");
    const { error } = await adminDb()
      .from("calls")
      .update({ is_open: formData.get("is_open") === "on", deadline: deadline || null, budget_max: budget })
      .eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/nabory");
    revalidatePath("/kreator");
    return { ok: true, message: "Zapisano." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Coś poszło nie tak." };
  }
}
