import Link from "next/link";
import { innovations } from "@/content/catalog";
import { adminDb } from "../_lib/supabase";
import { CATEGORY_LABELS, label } from "../_lib/labels";
import { VisibilityBadge } from "../_lib/status";

export const dynamic = "force-dynamic";

const DEMO_NOTE = "Dane poglądowe — baza ROPS nie jest podłączona w tym środowisku.";

type LibraryRow = {
  id: string;
  title: string;
  category: string | null;
  stage: string | null;
  published: boolean;
};

export default async function AdminLibrary({
  searchParams,
}: {
  searchParams: Promise<{ kategoria?: string; widocznosc?: string }>;
}) {
  const { kategoria = "", widocznosc = "" } = await searchParams;
  let rows: LibraryRow[] = [];
  let note = "";
  try {
    const { data, error } = await adminDb()
      .from("innovations")
      .select("id,title,category,stage,published")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    rows = (data ?? []) as LibraryRow[];
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    note = message.includes("Brak konfiguracji") ? DEMO_NOTE : "Nie udało się wczytać innowacji.";
    rows = innovations.map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      stage: item.stage,
      published: true,
    }));
  }

  const total = rows.length;
  // Filtering happens here rather than in the query so the demo rows filter too.
  const shown = rows.filter((row) => {
    if (kategoria && row.category !== kategoria) return false;
    if (widocznosc === "opublikowane" && !row.published) return false;
    if (widocznosc === "ukryte" && row.published) return false;
    return true;
  });
  const published = rows.filter((row) => row.published).length;
  const filtered = kategoria !== "" || widocznosc !== "";

  return (
    <section aria-labelledby="bib-h" className="admin-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Treści</p>
          <h1 id="bib-h">Biblioteka innowacji</h1>
          <p className="admin-page__lead">
            Wszystko, co widzą mieszkańcy na stronie Biblioteki. Kliknij tytuł,
            żeby poprawić opis albo ukryć wpis.
          </p>
        </div>
      </div>

      {note ? (
        <p role="status" className="admin-notice">
          {note}
        </p>
      ) : null}

      <dl className="admin-stats">
        <div>
          <dt>Wszystkie</dt>
          <dd>{total}</dd>
        </div>
        <div>
          <dt>Opublikowane</dt>
          <dd>{published}</dd>
        </div>
        <div>
          <dt>Ukryte</dt>
          <dd>{total - published}</dd>
        </div>
        <div>
          <dt>Na liście</dt>
          <dd>{shown.length}</dd>
        </div>
      </dl>

      <form method="get" className="admin-card">
        <div className="admin-card__head">
          <h2>Zawęź listę</h2>
        </div>
        <div className="admin-filters">
          <p className="admin-field">
            <label htmlFor="f-kategoria">Kategoria</label>
            <select
              id="f-kategoria"
              name="kategoria"
              defaultValue={kategoria}
              className="admin-select"
            >
              <option value="">Wszystkie</option>
              {Object.entries(CATEGORY_LABELS).map(([key, text]) => (
                <option key={key} value={key}>
                  {text}
                </option>
              ))}
            </select>
          </p>
          <p className="admin-field">
            <label htmlFor="f-widocznosc">Widoczność</label>
            <select
              id="f-widocznosc"
              name="widocznosc"
              defaultValue={widocznosc}
              className="admin-select"
            >
              <option value="">Wszystkie</option>
              <option value="opublikowane">Opublikowane</option>
              <option value="ukryte">Ukryte</option>
            </select>
          </p>
          <button type="submit" className="admin-primary-action">
            Pokaż
          </button>
          {filtered ? (
            <Link href="/admin/biblioteka" className="secondary-action">
              Wyczyść filtry
            </Link>
          ) : null}
        </div>
      </form>

      {shown.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <caption>
              {filtered
                ? `${shown.length} z ${total} innowacji po filtrach`
                : `Wszystkie innowacje (${total}), od najnowszej`}
            </caption>
            <thead>
              <tr>
                <th scope="col">Tytuł</th>
                <th scope="col">Kategoria</th>
                <th scope="col">Etap</th>
                <th scope="col">Widoczność</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((item) => (
                <tr key={item.id}>
                  <th scope="row">
                    <Link href={`/admin/biblioteka/${item.id}`}>{item.title}</Link>
                  </th>
                  <td>{label(CATEGORY_LABELS, item.category)}</td>
                  <td>{item.stage ?? "—"}</td>
                  <td>
                    <VisibilityBadge published={item.published} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="admin-empty">
          Żadna innowacja nie pasuje do tych filtrów. Zmień je albo wyczyść.
        </p>
      )}
    </section>
  );
}
