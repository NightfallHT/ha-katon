import Link from "next/link";
import { DEMO_SUBMISSIONS } from "@/content/demo-submissions";
import { adminDb } from "../_lib/supabase";
import { STATUS_LABELS, TYPE_LABELS, formatDate, label } from "../_lib/labels";

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

  return (
    <section aria-labelledby="zgloszenia">
      <h1 id="zgloszenia" className="text-2xl font-semibold">Zgłoszenia</h1>

      <form method="get" className="mt-4 flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="f-status" className="block font-medium">Status</label>
          <select id="f-status" name="status" defaultValue={status} className="mt-1 min-h-11 rounded-md border px-3">
            <option value="">Wszystkie</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-type" className="block font-medium">Rodzaj</label>
          <select id="f-type" name="type" defaultValue={type} className="mt-1 min-h-11 rounded-md border px-3">
            <option value="">Wszystkie</option>
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="min-h-11 rounded-md border px-4 font-medium focus-visible:ring-2 focus-visible:ring-ring">
          Filtruj
        </button>
      </form>

      {error && <p role="status" className="mt-4 rounded-md border p-3">{error}</p>}

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left">
          <caption className="sr-only">Lista zgłoszeń, od najnowszych</caption>
          <thead>
            <tr className="border-b">
              <th scope="col" className="p-2">Tytuł</th>
              <th scope="col" className="p-2">Rodzaj</th>
              <th scope="col" className="p-2">Autor</th>
              <th scope="col" className="p-2">Data</th>
              <th scope="col" className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b">
                <th scope="row" className="p-2 font-medium">
                  <Link href={`/admin/zgloszenia/${r.id}`} className="underline focus-visible:ring-2 focus-visible:ring-ring">
                    {r.title}
                  </Link>
                </th>
                <td className="p-2">{label(TYPE_LABELS, r.type)}</td>
                <td className="p-2">{r.author_name || r.author_email}</td>
                <td className="p-2">{formatDate(r.created_at)}</td>
                <td className="p-2">
                  <span className="rounded-full border px-2 py-1 text-sm font-semibold">{label(STATUS_LABELS, r.status)}</span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && !error && (
              <tr><td colSpan={5} className="p-4">Brak zgłoszeń dla wybranych filtrów.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
