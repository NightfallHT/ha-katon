import { calls } from "@/content/catalog";
import { slugify } from "@/content/labels";
import { adminDb } from "../_lib/supabase";
import { CallForm } from "./call-form";

export const dynamic = "force-dynamic";

const DEMO_NOTE = "Dane poglądowe — baza ROPS nie jest podłączona w tym środowisku.";

type CallRow = {
  id: string;
  name: string;
  description: string | null;
  is_open: boolean;
  deadline: string | null;
  budget_max: number | null;
};

function demoCalls(): CallRow[] {
  return calls.map((call) => ({
    id: slugify(call.name),
    name: call.name,
    description: call.description,
    is_open: call.is_open,
    deadline: call.deadline,
    budget_max: call.budget_max,
  }));
}

export default async function CallsPage() {
  let rows: CallRow[] = [];
  let note = "";
  try {
    const { data, error } = await adminDb()
      .from("calls")
      .select("id,name,description,is_open,deadline,budget_max")
      .order("name");
    if (error) throw new Error(error.message);
    rows = (data ?? []) as CallRow[];
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    note = message.includes("Brak konfiguracji") ? DEMO_NOTE : "Nie udało się wczytać naborów.";
    rows = demoCalls();
  }
  const open = rows.filter((row) => row.is_open).length;

  return (
    <section aria-labelledby="nabory-h" className="admin-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Granty</p>
          <h1 id="nabory-h">Nabory grantowe</h1>
          <p className="admin-page__lead">
            Otwarty nabór pojawia się na stronie {"„Złóż wniosek o grant”"}{" "}
            razem z terminem i kwotą, które tu ustawisz.
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
          <dt>Nabory</dt>
          <dd>{rows.length}</dd>
        </div>
        <div>
          <dt>Otwarte</dt>
          <dd>{open}</dd>
        </div>
        <div>
          <dt>Zamknięte</dt>
          <dd>{rows.length - open}</dd>
        </div>
      </dl>

      {rows.length ? (
        rows.map((call) => <CallForm key={call.id} call={call} />)
      ) : (
        <p className="admin-empty">
          Brak naborów w bazie. Dodaj wiersz w tabeli {"„Nabory”"} w Danych
          w bazie.
        </p>
      )}
    </section>
  );
}
