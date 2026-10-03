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
    <section aria-labelledby="tester-h" className="tester-panel">
      <div className="tester-panel__heading">
        <p className="eyebrow">Weź udział</p>
        <h2 id="tester-h">Przetestuj i oceń inicjatywę</h2>
        <p>Każde pole oznaczone jako wymagane musi być wypełnione.</p>
      </div>

      <div className="tester-panel__forms">
        <section aria-labelledby="signup-heading">
          <span className="tester-panel__step" aria-hidden="true">01</span>
          <h3 id="signup-heading">Zapisz się do testowania</h3>
          <p>Podaj dane kontaktowe. Zespół odezwie się z informacją o następnym teście.</p>
          <SignUpForm innovationId={innovationId} innovationTitle={innovationTitle} defaultEmail={email} />
        </section>

        <section aria-labelledby="review-heading">
          <span className="tester-panel__step" aria-hidden="true">02</span>
          <h3 id="review-heading">Oceń, jeśli testowałeś</h3>
          <p>Napisz, w jakiej sytuacji korzystałeś z rozwiązania i co o nim myślisz.</p>
          <ReviewForm innovationId={innovationId} innovationTitle={innovationTitle} defaultEmail={email} />
        </section>
      </div>

      <div className="tester-panel__reviews">
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
