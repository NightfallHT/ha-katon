import Link from "next/link";
import { adminDb } from "../_lib/supabase";
import { TABLES } from "./_tables";

export const dynamic = "force-dynamic";

async function counts() {
  const db = adminDb();
  const entries = await Promise.all(
    TABLES.map(async (table) => {
      try {
        const { count } = await db
          .from(table.name)
          .select("id", { count: "exact", head: true });
        return [table.name, count ?? 0] as const;
      } catch {
        return [table.name, null] as const;
      }
    }),
  );
  return Object.fromEntries(entries) as Record<string, number | null>;
}

export default async function DanePage() {
  let rowCounts: Record<string, number | null> = {};
  let error = "";
  try {
    rowCounts = await counts();
  } catch (e) {
    error = e instanceof Error ? e.message : "Nie udało się połączyć z bazą.";
  }

  return (
    <section aria-labelledby="dane-h" className="admin-shell">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Panel ROPS</p>
          <h1 id="dane-h">Dane w bazie</h1>
          <p>
            Wybierz kategorię, żeby przeglądać i edytować wiersze. Zmiany
            zapisują się od razu w bazie.
          </p>
        </div>
      </div>

      {error ? (
        <p role="alert" className="form-error">
          {error}
        </p>
      ) : null}

      <ul className="feature-grid dane-grid">
        {TABLES.map((table) => (
          <li key={table.name}>
            <Link href={`/admin/dane/${table.name}`}>
              <span aria-hidden="true" className="feature-grid__icon">
                {table.glyph}
              </span>
              <strong>{table.label}</strong>
              {rowCounts[table.name] === null || rowCounts[table.name] === undefined ? null : (
                <span className="dane-grid__count">
                  {rowCounts[table.name]}{" "}
                  <span className="dane-grid__count-label">
                    {rowCounts[table.name] === 1 ? "wiersz" : "wierszy"}
                  </span>
                </span>
              )}
              <span>{table.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
