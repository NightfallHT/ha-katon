import { PAYLOAD_LABELS } from "../../_lib/labels";

type Row = { item?: string; category?: string; amount?: number };

const plain = (v: unknown) => (v === true ? "tak" : v === false ? "nie" : String(v));
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const name = (k: string) => PAYLOAD_LABELS[k] ?? k.replaceAll("_", " ");

function Fields({ data }: { data: Record<string, unknown> }) {
  return (
    <dl>
      {Object.entries(data).map(([k, v]) => (
        <div key={k}>
          <dt>{name(k)}</dt>
          <dd>{isObj(v) || Array.isArray(v) ? JSON.stringify(v) : plain(v)}</dd>
        </div>
      ))}
    </dl>
  );
}

function Budget({ rows }: { rows: Row[] }) {
  const total = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const fmt = (n: number) => `${new Intl.NumberFormat("pl-PL").format(n)} zł`;
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <caption className="sr-only">Budżet wniosku</caption>
        <thead>
          <tr>
            <th scope="col">Pozycja</th>
            <th scope="col">Kategoria</th>
            <th scope="col" className="admin-table__num">
              Kwota
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <th scope="row">{r.item ?? "—"}</th>
              <td>{r.category ?? "—"}</td>
              <td className="admin-table__num">{fmt(Number(r.amount) || 0)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" colSpan={2}>
              Razem
            </th>
            <td className="admin-table__num">
              <strong>{fmt(total)}</strong>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// Readable view of submissions.payload. Nested objects (fiszka, sections) become sub-lists, budget becomes a table.
export function PayloadView({ payload }: { payload: Record<string, unknown> }) {
  const entries = Object.entries(payload);
  if (entries.length === 0) return <p className="admin-empty">Brak dodatkowych pól.</p>;
  const simple: Record<string, unknown> = {};
  const blocks: [string, unknown][] = [];
  for (const [k, v] of entries) {
    if (isObj(v) || Array.isArray(v)) blocks.push([k, v]);
    else simple[k] = v;
  }
  return (
    <div className="admin-payload">
      {Object.keys(simple).length > 0 && <Fields data={simple} />}
      {blocks.map(([k, v]) => (
        <div key={k}>
          <h3>{name(k)}</h3>
          {k === "budget" && Array.isArray(v) ? (
            <Budget rows={v as Row[]} />
          ) : isObj(v) ? (
            <Fields data={v} />
          ) : (
            <p className="admin-payload__raw">{JSON.stringify(v)}</p>
          )}
        </div>
      ))}
    </div>
  );
}
