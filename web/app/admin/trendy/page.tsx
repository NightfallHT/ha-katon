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
      return { week: DEMO_NEEDS, latest: DEMO_NEEDS, demo: true, error: "Nie udało się wczytać zapytań." };
    }
    if (weekRows.length === 0 && latestRows.length === 0) {
      return { week: DEMO_NEEDS, latest: DEMO_NEEDS, demo: true, error: "" };
    }
    return { week: weekRows, latest: latestRows, demo: false, error: "" };
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    if (message.includes("Brak konfiguracji")) {
      return { week: DEMO_NEEDS, latest: DEMO_NEEDS, demo: true, error: "" };
    }
    return { week: DEMO_NEEDS, latest: DEMO_NEEDS, demo: true, error: "Nie udało się wczytać zapytań." };
  }
}

function queries(count: number) {
  if (count === 1) return "zapytanie";
  const rest = count % 10;
  const teens = count % 100;
  if (rest >= 2 && rest <= 4 && (teens < 12 || teens > 14)) return "zapytania";
  return "zapytań";
}

export default async function TrendsPage() {
  const { week, latest, demo, error } = await loadNeeds();

  const counts = new Map<string, number>();
  for (const n of week) counts.set(n.category ?? "inne", (counts.get(n.category ?? "inne") ?? 0) + 1);
  const rows = [...counts.entries()]
    .map(([k, count]) => ({ name: label(CATEGORY_LABELS, k), count }))
    .sort((a, b) => b.count - a.count);
  const top = rows[0];
  const locations = new Set(week.map((n) => n.location).filter(Boolean)).size;

  return (
    <section aria-labelledby="trendy-h" className="admin-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Analiza</p>
          <h1 id="trendy-h">Trendy zapytań</h1>
          <p className="admin-page__lead">
            Czego mieszkańcy szukali w ostatnich 7 dniach. Każde zapytanie
            z wyszukiwarki trafia tutaj bez danych osobowych.
          </p>
        </div>
      </div>

      {error ? (
        <p role="alert" className="admin-notice admin-notice--alert">
          {error}
        </p>
      ) : null}
      {demo ? (
        <p role="status" className="admin-notice">
          To przykładowe zapytania z demo — baza jeszcze nie zbiera potrzeb.
        </p>
      ) : null}

      <dl className="admin-stats">
        <div>
          <dt>Zapytania w 7 dni</dt>
          <dd>{week.length}</dd>
        </div>
        <div>
          <dt>Kategorie</dt>
          <dd>{rows.length}</dd>
        </div>
        <div>
          <dt>Najczęstszy temat</dt>
          <dd>{top ? top.name : "—"}</dd>
        </div>
        <div>
          <dt>Różne lokalizacje</dt>
          <dd>{locations}</dd>
        </div>
      </dl>

      <p className="admin-notice">
        {top
          ? `Najczęściej zgłaszany problem w tym tygodniu: ${top.name} — ${top.count} ${queries(top.count)}.`
          : "W tym tygodniu nie było jeszcze zapytań."}
      </p>

      {rows.length > 0 ? (
        <section aria-labelledby="podzial-h" className="admin-card">
          <div className="admin-card__head">
            <h2 id="podzial-h">Podział na kategorie</h2>
            <p className="admin-card__note">ostatnie 7 dni</p>
          </div>
          <TrendChart data={rows} />
          <div className="admin-table-wrap">
            <table className="admin-table">
              <caption>
                Te same liczby w tabeli — wykres obok jest tylko ilustracją.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Kategoria</th>
                  <th scope="col" className="admin-table__num">
                    Liczba zapytań
                  </th>
                  <th scope="col" className="admin-table__num">
                    Udział
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.name}>
                    <th scope="row">{r.name}</th>
                    <td className="admin-table__num">{r.count}</td>
                    <td className="admin-table__num">
                      {Math.round((r.count / week.length) * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section aria-labelledby="ostatnie-h" className="admin-card">
        <div className="admin-card__head">
          <h2 id="ostatnie-h">Ostatnie zapytania</h2>
          <p className="admin-card__note">
            {latest.length} {latest.length === 1 ? "wpis" : "wpisów"}
          </p>
        </div>
        {latest.length ? (
          <ul className="admin-list">
            {latest.map((n) => (
              <li key={n.id}>
                <p>{n.text}</p>
                <p className="admin-list__meta">
                  {label(CATEGORY_LABELS, n.category)} ·{" "}
                  {n.location || "brak lokalizacji"} · {formatDate(n.created_at)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="admin-empty">Brak zapytań.</p>
        )}
      </section>
    </section>
  );
}
