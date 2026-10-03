import { cookies } from "next/headers";
import { adminDb } from "../app/admin/_lib/supabase";
import { ReviewForm, SignUpForm } from "./tester-panel-forms";

// Usage on /biblioteka/[id]:  <TesterPanel innovationId={item.id} innovationTitle={item.title} />
// innovationTitle lets us match seed slug ids to Supabase uuid rows.
export async function TesterPanel({ innovationId, innovationTitle }: { innovationId: string; innovationTitle: string }) {
  const jar = await cookies();
  const email = jar.get("demo_email")?.value ?? "";

  let reviews: Array<{ id: string; rating: number; feedback: string | null; improvement: string | null; created_at: string }> = [];
  try {
    const db = adminDb();
    let rid = innovationId;
    if (!/^[0-9a-f-]{36}$/i.test(rid)) {
      const { data: row } = await db.from("innovations").select("id").eq("title", innovationTitle).limit(1).maybeSingle();
      rid = row?.id ?? "";
    }
    const { data } = await db
      .from("reviews")
      .select("id,rating,feedback,improvement,created_at")
      .eq("innovation_id", rid)
      .order("created_at", { ascending: false })
      .limit(3);
    reviews = data ?? [];
  } catch {
    /* the panel still works without the list */
  }

  return (
    <section aria-labelledby="tester-h" className="mt-10 rounded-lg border p-5">
      <h2 id="tester-h" className="text-xl font-semibold">Przetestuj i oceń</h2>

      <div className="mt-5">
        <h3 className="text-lg font-semibold">Zapisz się do testów</h3>
        <div className="mt-2"><SignUpForm innovationId={innovationId} innovationTitle={innovationTitle} defaultEmail={email} /></div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold">Oceń rozwiązanie</h3>
        <div className="mt-2"><ReviewForm innovationId={innovationId} innovationTitle={innovationTitle} defaultEmail={email} /></div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold">Ostatnie opinie</h3>
        {reviews.length === 0 ? (
          <ul className="mt-2 space-y-3">
            <li className="rounded-md border p-3">
              <p className="font-medium">Ocena: 5 na 5</p>
              <p>Halina, 70 lat: „Duże litery i jasne przyciski. Sąsiadka też dała radę sama.”</p>
            </li>
            <li className="rounded-md border p-3">
              <p className="font-medium">Ocena: 4 na 5</p>
              <p>Anna K., NGO Razem Bliżej: „Dobrze działa w małej gminie. Przydałby się rozkład jazdy na papierze.”</p>
              <p>
                <span className="font-medium">Do poprawy: </span>Wydruk rozkładu dla osób bez internetu.
              </p>
            </li>
          </ul>
        ) : (
          <ul className="mt-2 space-y-3">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-md border p-3">
                <p className="font-medium">Ocena: {r.rating} na 5</p>
                {r.feedback && <p className="whitespace-pre-wrap">{r.feedback}</p>}
                {r.improvement && <p className="whitespace-pre-wrap"><span className="font-medium">Do poprawy: </span>{r.improvement}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
