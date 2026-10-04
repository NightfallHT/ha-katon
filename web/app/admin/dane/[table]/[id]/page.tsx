import { notFound } from "next/navigation";
import { adminDb } from "../../../_lib/supabase";
import { BackLink } from "../../../_lib/back-link";
import { getTable, selectList } from "../../_tables";
import { deleteRow } from "../../actions";
import { RowForm } from "../../row-form";

export const dynamic = "force-dynamic";

export default async function RowPage({
  params,
}: {
  params: Promise<{ table: string; id: string }>;
}) {
  const { table: tableName, id } = await params;
  const table = getTable(tableName);
  if (!table) notFound();

  const creating = id === "nowy";
  if (creating && !table.canCreate) notFound();

  let row: Record<string, unknown> = {};
  let error = "";

  if (!creating) {
    try {
      const { data, error: dbError } = await adminDb()
        .from(table.name)
        .select(selectList(table))
        .eq("id", id)
        .maybeSingle();
      if (dbError) throw new Error(dbError.message);
      if (!data) notFound();
      row = data as unknown as Record<string, unknown>;
    } catch (e) {
      if (e instanceof Error && e.message === "NEXT_NOT_FOUND") throw e;
      error = e instanceof Error ? e.message : "Nie udało się wczytać wiersza.";
    }
  }

  const title = creating
    ? `Nowy wiersz: ${table.label}`
    : String(row[table.titleField] ?? "Wiersz") || "Wiersz";

  return (
    <div>
      <BackLink href={`/admin/dane/${table.name}`}>
        Wróć do: {table.label}
      </BackLink>
      <h1 className="dane-title">{title}</h1>

      {error ? (
        <p role="alert" className="form-error">
          {error}
        </p>
      ) : (
        <div className="dane-form-wrap">
          <RowForm table={table} row={row} mode={creating ? "create" : "edit"} />
        </div>
      )}

      {!creating && !error ? (
        <section aria-labelledby="usun-h" className="dane-danger-zone">
          <h2 id="usun-h">
            Usuń wiersz
          </h2>
          <p >
            Tego nie można cofnąć. Wiersz zniknie z bazy i ze stron publicznych.
          </p>
          <form action={deleteRow.bind(null, table.name, id)}>
            <button
              type="submit"
              className="dane-danger"
            >
              Usuń na stałe
            </button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
