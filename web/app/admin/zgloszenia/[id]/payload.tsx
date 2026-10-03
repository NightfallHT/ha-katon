import { PAYLOAD_LABELS } from "../../_lib/labels";

type Row = { item?: string; category?: string; amount?: number };

const plain = (v: unknown) => (v === true ? "tak" : v === false ? "nie" : String(v));
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const name = (k: string) => PAYLOAD_LABELS[k] ?? k.replaceAll("_", " ");

function Fields({ data }: { data: Record<string, unknown> }) {
  return (
    <dl className="space-y-3">
      {Object.entries(data).map(([k, v]) => (
        <div key={k}>
          <dt className="font-medium">{name(k)}</dt>
          <dd className="whitespace-pre-wrap">{isObj(v) || Array.isArray(v) ? JSON.stringify(v) : plain(v)}</dd>
        </div>
      ))}
    </dl>
  );
}

function Budget({ rows }: { rows: Row[] }) {
  const total = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const fmt = (n: number) => `${new Intl.NumberFormat("pl-PL").format(n)} zł`;
  return (
    <table className="mt-2 w-full max-w-xl text-left">
      <caption className="sr-only">Budżet wniosku</caption>
      <thead>
        <tr className="border-b">
          <th scope="col" className="p-2">Pozycja</th>
          <th scope="col" className="p-2">Kategoria</th>
          <th scope="col" className="p-2 text-right">Kwota</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-b">
            <th scope="row" className="p-2 font-medium">{r.item ?? "—"}</th>
            <td className="p-2">{r.category ?? "—"}</td>
            <td className="p-2 text-right">{fmt(Number(r.amount) || 0)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr><th scope="row" colSpan={2} className="p-2">Razem</th><td className="p-2 text-right font-semibold">{fmt(total)}</td></tr>
      </tfoot>
    </table>
  );
}

// Readable view of submissions.payload. Nested objects (fiszka, sections) become sub-lists, budget becomes a table.
export function PayloadView({ payload }: { payload: Record<string, unknown> }) {
  const entries = Object.entries(payload);
  if (entries.length === 0) return <p>Brak dodatkowych pól.</p>;
  const simple: Record<string, unknown> = {};
  const blocks: [string, unknown][] = [];
  for (const [k, v] of entries) {
    if (isObj(v) || Array.isArray(v)) blocks.push([k, v]);
    else simple[k] = v;
  }
  return (
    <div className="space-y-6">
      {Object.keys(simple).length > 0 && <Fields data={simple} />}
      {blocks.map(([k, v]) => (
        <div key={k}>
          <h3 className="font-semibold">{name(k)}</h3>
          {k === "budget" && Array.isArray(v) ? <Budget rows={v as Row[]} /> : isObj(v) ? <div className="mt-2"><Fields data={v} /></div> : <p className="mt-2 whitespace-pre-wrap">{JSON.stringify(v)}</p>}
        </div>
      ))}
    </div>
  );
}
