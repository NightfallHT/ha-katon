import { adminDb } from "../_lib/supabase";
import { CallForm } from "./call-form";

export const dynamic = "force-dynamic";

export default async function CallsPage() {
  const { data, error } = await adminDb().from("calls").select("id,name,description,is_open,deadline,budget_max").order("name");
  return (
    <section aria-labelledby="nabory-h">
      <h1 id="nabory-h" className="text-2xl font-semibold">Nabory grantowe</h1>
      {error && <p role="alert" className="mt-4 rounded-md border p-3">Nie udało się wczytać naborów.</p>}
      <div className="mt-6 space-y-6">
        {(data ?? []).map((c) => <CallForm key={c.id} call={c} />)}
        {(data ?? []).length === 0 && !error && <p>Brak naborów w bazie.</p>}
      </div>
    </section>
  );
}
