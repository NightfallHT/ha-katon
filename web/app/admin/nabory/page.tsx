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
  return (
    <section aria-labelledby="nabory-h">
      <h1 id="nabory-h" className="text-2xl font-semibold">Nabory grantowe</h1>
      {note ? <p role="status" className="mt-4 rounded-md border p-3">{note}</p> : null}
      <div className="mt-6 space-y-6">
        {rows.map((c) => <CallForm key={c.id} call={c} />)}
        {rows.length === 0 && !note ? <p>Brak naborów w bazie.</p> : null}
      </div>
    </section>
  );
}
