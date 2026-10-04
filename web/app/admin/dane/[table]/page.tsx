import Link from "next/link";
import { notFound } from "next/navigation";
import { adminDb } from "../../_lib/supabase";
import { BackLink } from "../../_lib/back-link";
import { getTable, selectList } from "../_tables";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

function cell(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "tak" : "nie";
  if (Array.isArray(value)) return value.join(", ") || "—";
  if (typeof value === "object") return JSON.stringify(value).slice(0, 80);
  const text = String(value);
  return text.length > 90 ? `${text.slice(0, 90)}…` : text;
}

export default async function TableListPage({
  params,
  searchParams,
}: {
  params: Promise<{ table: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { table: tableName } = await params;
  const { q } = await searchParams;
  const table = getTable(tableName);
  if (!table) notFound();

  const search = (q ?? "").trim();
  let rows: Record<string, unknown>[] = [];
  let error = "";

  try {
    let query = adminDb().from(table.name).select(selectList(table));
    if (search && table.searchFields.length) {
      // One ilike per searchable text column, OR-ed together.
      const escaped = search.replaceAll(",", " ").replaceAll("*", "");
      query = query.or(
        table.searchFields.map((field) => `${field}.ilike.%${escaped}%`).join(","),
      );
    }
    if (table.orderBy) query = query.order(table.orderBy, { ascending: false });
    const { data, error: dbError } = await query.limit(PAGE_SIZE);
    if (dbError) throw new Error(dbError.message);
    rows = (data ?? []) as unknown as Record<string, unknown>[];
  } catch (e) {
    error = e instanceof Error ? e.message : "Nie udało się wczytać danych.";
  }

  return (
    <div>
      <BackLink href="/admin/dane">Wróć do kategorii</BackLink>
      <h1 className="dane-title">{table.label}</h1>
      <p>{table.description}</p>

      <div className="dane-toolbar">
        <form method="get" className="dane-search">
          <div>
            <label htmlFor="q">
              Szukaj
            </label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={search}
              placeholder={`Szukaj w: ${table.searchFields.join(", ")}`}
              className="dane-field"
            />
          </div>
          <button
            type="submit"
            className="secondary-action"
          >
            Szukaj
          </button>
          {search ? (
            <Link
              href={`/admin/dane/${table.name}`}
              className="secondary-action"
            >
              Wyczyść
            </Link>
          ) : null}
        </form>
        {table.canCreate ? (
          <Link
            href={`/admin/dane/${table.name}/nowy`}
            className="admin-primary-action"
          >
            Dodaj nowy wiersz
          </Link>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="form-error">
          {error}
        </p>
      ) : null}

      <p  aria-live="polite">
        {rows.length === PAGE_SIZE
          ? `Pokazujemy pierwsze ${PAGE_SIZE} wierszy. Zawęź wyszukiwanie, żeby zobaczyć inne.`
          : `Znaleziono ${rows.length} ${rows.length === 1 ? "wiersz" : "wierszy"}.`}
      </p>

      {rows.length ? (
        // Wide tables scroll inside their own container so the page never does.
        <div className="dane-table-wrap">
          <table className="dane-table">
            <caption className="sr-only">
              {table.label} — lista wierszy z linkiem do edycji
            </caption>
            <thead>
              <tr>
                <th scope="col">
                  {table.fields.find((f) => f.name === table.titleField)?.label ??
                    "Nazwa"}
                </th>
                {table.listFields.map((name) => (
                  <th key={name} scope="col">
                    {table.fields.find((f) => f.name === name)?.label ?? name}
                  </th>
                ))}
                <th scope="col">
                  Działanie
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={String(row.id)}>
                  <th scope="row">
                    {cell(row[table.titleField])}
                  </th>
                  {table.listFields.map((name) => (
                    <td key={name} >
                      {cell(row[name])}
                    </td>
                  ))}
                  <td >
                    <Link
                      href={`/admin/dane/${table.name}/${row.id}`}
                      className="dane-table__edit"
                    >
                      Edytuj
                      <span className="sr-only">
                        {" "}
                        — {cell(row[table.titleField])}
                      </span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !error ? (
        <p >Brak wierszy do pokazania.</p>
      ) : null}
    </div>
  );
}
