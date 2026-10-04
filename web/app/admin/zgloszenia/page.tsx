import Link from "next/link";
import { DEMO_SUBMISSIONS } from "@/content/demo-submissions";
import { adminDb } from "../_lib/supabase";
import { STATUS_LABELS, TYPE_LABELS, formatDate, label } from "../_lib/labels";
import { StatusBadge } from "../_lib/status";

export const dynamic = "force-dynamic";

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string }>;
}) {
  const { status = "", type = "" } = await searchParams;
  let rows: Array<Record<string, string>> = [];
  let error = "";
  try {
    let q = adminDb()
      .from("submissions")
      .select("id,type,title,author_name,author_email,status,created_at")
      .order("created_at", { ascending: false });
    if (status) q = q.eq("status", status);
    if (type) q = q.eq("type", type);
    const res = await q;
    if (res.error) throw new Error(res.error.message);
    rows = res.data ?? [];
  } catch {
    error = "Lista poglądowa — baza ROPS nie jest podłączona w tym środowisku.";
    rows = DEMO_SUBMISSIONS.filter((item) => {
      if (status && item.status !== status) return false;
      if (type && item.type !== type) return false;
      return true;
    }).map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      author_name: item.author_name,
      author_email: item.author_email,
      status: item.status,
      created_at: item.created_at,
    }));
  }

  const byStatus = (key: string) => rows.filter((row) => row.status === key).length;
  const filtered = status !== "" || type !== "";

  return (
    <section aria-labelledby="zgloszenia" className="admin-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Skrzynka</p>
          <h1 id="zgloszenia">Zgłoszenia</h1>
          <p className="admin-page__lead">
            Pomysły, dobre praktyki, wnioski i wiadomości od mieszkańców.
            Kliknij tytuł, żeby odpowiedzieć i podjąć decyzję.
          </p>
        </div>
      </div>

      {error ? (
        <p role="status" className="admin-notice">
          {error}
        </p>
      ) : null}

      {/* The counts always describe the whole list, so they stay useful as a
          to-do even while a filter is on. */}
      <dl className="admin-stats">
        <div>
          <dt>{filtered ? "Po filtrach" : "Wszystkie"}</dt>
          <dd>{rows.length}</dd>
        </div>
        <div>
          <dt>Nowe</dt>
          <dd>{byStatus("nowe")}</dd>
        </div>
        <div>
          <dt>W ocenie</dt>
          <dd>{byStatus("w_ocenie")}</dd>
        </div>
        <div>
          <dt>Zaakceptowane</dt>
          <dd>{byStatus("zaakceptowane")}</dd>
        </div>
      </dl>

      <form method="get" className="admin-card">
        <div className="admin-card__head">
          <h2>Zawęź listę</h2>
        </div>
        <div className="admin-filters">
          <p className="admin-field">
            <label htmlFor="f-status">Status</label>
            <select
              id="f-status"
              name="status"
              defaultValue={status}
              className="admin-select"
            >
              <option value="">Wszystkie</option>
              {Object.entries(STATUS_LABELS).map(([key, text]) => (
                <option key={key} value={key}>
                  {text}
                </option>
              ))}
            </select>
          </p>
          <p className="admin-field">
            <label htmlFor="f-type">Rodzaj</label>
            <select id="f-type" name="type" defaultValue={type} className="admin-select">
              <option value="">Wszystkie</option>
              {Object.entries(TYPE_LABELS).map(([key, text]) => (
                <option key={key} value={key}>
                  {text}
                </option>
              ))}
            </select>
          </p>
          <button type="submit" className="admin-primary-action">
            Pokaż
          </button>
          {filtered ? (
            <Link href="/admin/zgloszenia" className="secondary-action">
              Wyczyść filtry
            </Link>
          ) : null}
        </div>
      </form>

      {rows.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <caption>
              {filtered
                ? `${rows.length} zgłoszeń po filtrach, od najnowszych`
                : "Wszystkie zgłoszenia, od najnowszych"}
            </caption>
            <thead>
              <tr>
                <th scope="col">Tytuł</th>
                <th scope="col">Rodzaj</th>
                <th scope="col">Autor</th>
                <th scope="col">Data</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <th scope="row">
                    <Link href={`/admin/zgloszenia/${row.id}`}>{row.title}</Link>
                  </th>
                  <td>{label(TYPE_LABELS, row.type)}</td>
                  <td>{row.author_name || row.author_email}</td>
                  <td>{formatDate(row.created_at)}</td>
                  <td>
                    <StatusBadge status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="admin-empty">
          {filtered
            ? "Brak zgłoszeń dla wybranych filtrów. Zmień je albo wyczyść."
            : "Nie ma jeszcze żadnych zgłoszeń."}
        </p>
      )}
    </section>
  );
}
