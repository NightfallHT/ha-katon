import Link from "next/link";
import { innovations } from "@/content/catalog";
import { adminDb } from "../_lib/supabase";
import { CATEGORY_LABELS, label } from "../_lib/labels";

export const dynamic = "force-dynamic";

const DEMO_NOTE = "Dane poglądowe — baza ROPS nie jest podłączona w tym środowisku.";

type LibraryRow = {
  id: string;
  title: string;
  category: string | null;
  stage: string | null;
  published: boolean;
};

export default async function AdminLibrary() {
  let rows: LibraryRow[] = [];
  let note = "";
  try {
    const { data, error } = await adminDb()
      .from("innovations")
      .select("id,title,category,stage,published")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    rows = (data ?? []) as LibraryRow[];
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    note = message.includes("Brak konfiguracji") ? DEMO_NOTE : "Nie udało się wczytać innowacji.";
    rows = innovations.map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      stage: item.stage,
      published: true,
    }));
  }
  return (
    <section aria-labelledby="bib-h">
      <h1 id="bib-h" className="text-2xl font-semibold">Biblioteka innowacji</h1>
      {note ? <p role="status" className="mt-4 rounded-md border p-3">{note}</p> : null}
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
            {rows.map((i) => (
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
