import Link from "next/link";
import { adminDb } from "../_lib/supabase";
import { CATEGORY_LABELS, label } from "../_lib/labels";

export const dynamic = "force-dynamic";

export default async function AdminLibrary() {
  const { data, error } = await adminDb()
    .from("innovations")
    .select("id,title,category,stage,published")
    .order("created_at", { ascending: false });
  return (
    <section aria-labelledby="bib-h">
      <h1 id="bib-h" className="text-2xl font-semibold">Biblioteka innowacji</h1>
      {error && <p role="alert" className="mt-4 rounded-md border p-3">Nie udało się wczytać innowacji.</p>}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left">
          <caption className="sr-only">Innowacje w Bibliotece</caption>
          <thead>
            <tr className="border-b">
              <th scope="col" className="p-2">Tytuł</th>
              <th scope="col" className="p-2">Kategoria</th>
              <th scope="col" className="p-2">Etap</th>
              <th scope="col" className="p-2">Widoczność</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((i) => (
              <tr key={i.id} className="border-b">
                <th scope="row" className="p-2 font-medium">
                  <Link href={`/admin/biblioteka/${i.id}`} className="underline focus-visible:ring-2 focus-visible:ring-ring">{i.title}</Link>
                </th>
                <td className="p-2">{label(CATEGORY_LABELS, i.category)}</td>
                <td className="p-2">{i.stage ?? "—"}</td>
                <td className="p-2">{i.published ? "Opublikowana" : "Ukryta"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
