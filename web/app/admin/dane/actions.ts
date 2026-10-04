"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminDb } from "../_lib/supabase";
import { isAdmin } from "../_lib/guard";
import { getTable, type Field } from "./_tables";

export type SaveResult = { ok: boolean; message: string };

// Public pages that render each table; refreshed after every save, create and delete
// so an admin change shows up without waiting for the page's revalidate window.
const PUBLIC_PATHS: Record<string, string[]> = {
  calls: ["/wyzwania", "/kreator", "/kreator/grant", "/kreator/grant/wniosek"],
};

function revalidateTable(tableName: string, id?: string) {
  revalidatePath(`/admin/dane/${tableName}`);
  if (id) revalidatePath(`/admin/dane/${tableName}/${id}`);
  if (tableName === "calls") revalidatePath("/admin/nabory");
  for (const path of PUBLIC_PATHS[tableName] ?? []) revalidatePath(path);
}

/** Turn one form value into the shape Postgres expects for that column. */
function coerce(field: Field, raw: FormDataEntryValue | null) {
  const value = typeof raw === "string" ? raw : "";
  switch (field.kind) {
    case "boolean":
      // Unchecked checkboxes are simply absent from FormData.
      return value === "on" || value === "true";
    case "number": {
      const trimmed = value.trim();
      if (!trimmed) return null;
      const parsed = Number(trimmed.replace(",", "."));
      if (Number.isNaN(parsed)) throw new Error(`„${field.label}” musi być liczbą.`);
      return parsed;
    }
    case "list":
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    case "json": {
      const trimmed = value.trim();
      if (!trimmed) return {};
      try {
        return JSON.parse(trimmed);
      } catch {
        throw new Error(`„${field.label}” nie jest poprawnym JSON-em.`);
      }
    }
    case "date":
      return value.trim() || null;
    default:
      return value.trim() || null;
  }
}

function build(tableName: string, formData: FormData) {
  const table = getTable(tableName);
  if (!table) throw new Error("Nieznana tabela.");
  const row: Record<string, unknown> = {};
  for (const field of table.fields) {
    if (field.kind === "readonly") continue;
    row[field.name] = coerce(field, formData.get(field.name));
  }
  return { table, row };
}

export async function saveRow(
  tableName: string,
  id: string,
  _prev: SaveResult | null,
  formData: FormData,
): Promise<SaveResult> {
  if (!(await isAdmin())) {
    return { ok: false, message: "Tylko pracownik ROPS może zapisywać dane." };
  }
  try {
    const { table, row } = build(tableName, formData);
    const { error } = await adminDb().from(table.name).update(row).eq("id", id);
    if (error) throw new Error(error.message);
    revalidateTable(table.name, id);
    return { ok: true, message: "Zapisano zmiany." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Nie udało się zapisać.",
    };
  }
}

export async function createRow(
  tableName: string,
  _prev: SaveResult | null,
  formData: FormData,
): Promise<SaveResult> {
  if (!(await isAdmin())) {
    return { ok: false, message: "Tylko pracownik ROPS może dodawać dane." };
  }
  let target = "";
  try {
    const { table, row } = build(tableName, formData);
    const { data, error } = await adminDb()
      .from(table.name)
      .insert(row)
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Nie udało się dodać wiersza.");
    revalidateTable(table.name);
    target = `/admin/dane/${table.name}/${data.id}`;
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Nie udało się dodać wiersza.",
    };
  }
  // redirect() throws internally, so it must run outside the try block.
  redirect(target);
}

export async function deleteRow(tableName: string, id: string) {
  if (!(await isAdmin())) return;
  const table = getTable(tableName);
  if (!table) return;
  await adminDb().from(table.name).delete().eq("id", id);
  revalidateTable(table.name);
  redirect(`/admin/dane/${table.name}`);
}
