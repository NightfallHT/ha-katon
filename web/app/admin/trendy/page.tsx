import { adminDb } from "../_lib/supabase";
import { CATEGORY_LABELS, formatDate, label } from "../_lib/labels";
import { TrendChart } from "./chart";

export const dynamic = "force-dynamic";

type NeedRow = {
  id: string;
  text: string;
  category: string | null;
  location: string | null;
  created_at: string;
};

const DEMO_NEEDS: NeedRow[] = [
  {
    id: "demo-1",
    text: "Słabo widzę. Chcę wiedzieć, z jakich innowacji w Małopolsce mogę skorzystać.",
    category: "niepelnosprawnosc",
    location: "Małopolska",
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-2",
    text: "Mam syna z niepełnosprawnością. Jakie projekty mogą nam pomóc?",
    category: "niepelnosprawnosc",
    location: "powiat nowosądecki",
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-3",
    text: "Starsi sąsiedzi są samotni i nie dojadą do lekarza.",
    category: "samotnosc",
    location: "gmina wiejska",
    created_at: new Date().toISOString(),
  },
];

// Demo rows only when the DB is reachable but empty; a failed query shows an alert above them.
async function loadNeeds(): Promise<{ week: NeedRow[]; latest: NeedRow[]; demo: boolean; error: string }> {
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const db = adminDb();
    const [week, latest] = await Promise.all([
      db.from("needs").select("id,text,category,location,created_at").gte("created_at", weekAgo),
      db.from("needs").select("id,text,category,location,created_at").order("created_at", { ascending: false }).limit(10),
    ]);
    const weekRows = (week.data ?? []) as NeedRow[];
    const latestRows = (latest.data ?? []) as NeedRow[];
    const failed = week.error ?? latest.error;
    if (failed) {
      return { week: DEMO_NEEDS, latest: DEMO_NEEDS, demo: true, error: `Nie udało się wczytać zapytań: ${failed.message}` };
    }
    if (weekRows.length === 0 && latestRows.length === 0) {
      return { week: DEMO_NEEDS, latest: DEMO_NEEDS, demo: true, error: "" };
    }
    return { week: weekRows, latest: latestRows, demo: false, error: "" };
  } catch (e) {
    const error = e instanceof Error ? e.message : "Nie udało się wczytać danych.";
    return { week: DEMO_NEEDS, latest: DEMO_NEEDS, demo: true, error };
  }
}

export default async function TrendsPage() {
  const { week, latest, demo, error } = await loadNeeds();

  const counts = new Map<string, number>();
  for (const n of week) counts.set(n.category ?? "inne", (counts.get(n.category ?? "inne") ?? 0) + 1);
  const rows = [...counts.entries()]
    .map(([k, count]) => ({ name: label(CATEGORY_LABELS, k), count }))
    .sort((a, b) => b.count - a.count);
  const top = rows[0];

  return (
    <section aria-labelledby="trendy-h">
      <h1 id="trendy-h" className="text-2xl font-semibold">
        Trendy zapytań
      </h1>
      {error && <p role="alert" className="mt-4 rounded-md border p-3">{error}</p>}
      <p className="mt-3 text-lg">
        {top
          ? `Najczęściej zgłaszany problem w tym tygodniu: ${top.name} (${top.count} ${top.count === 1 ? "zapytanie" : "zapytań"}).`
          : "W tym tygodniu nie było jeszcze zapytań."}
      </p>
      {demo ? (
        <p className="mt-2">To przykładowe zapytania z demo, gdy baza jeszcze nie zbiera potrzeb.</p>
      ) : null}

      {rows.length > 0 && (
        <>
          <div className="mt-6">
            <TrendChart data={rows} />
          </div>
          <table className="mt-6 w-full max-w-lg text-left">
            <caption className="mb-2 text-left font-medium">
              Zapytania w ostatnich 7 dniach, według kategorii
            </caption>
            <thead>
              <tr className="border-b">
                <th scope="col" className="p-2">
                  Kategoria
                </th>
                <th scope="col" className="p-2">
                  Liczba zapytań
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.name} className="border-b">
                  <th scope="row" className="p-2 font-medium">
                    {r.name}
                  </th>
                  <td className="p-2">{r.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <h2 className="mt-10 text-xl font-semibold">Ostatnie 10 zapytań</h2>
      <ul className="mt-3 space-y-2">
        {latest.map((n) => (
          <li key={n.id} className="rounded-md border p-3">
            <p>{n.text}</p>
            <p className="text-sm">
              {label(CATEGORY_LABELS, n.category)} · {n.location || "brak lokalizacji"} · {formatDate(n.created_at)}
            </p>
          </li>
        ))}
        {latest.length === 0 && <li>Brak zapytań.</li>}
      </ul>
    </section>
  );
}
