import Link from "next/link";
import { notFound } from "next/navigation";
import { adminDb } from "../../_lib/supabase";
import { EditForm } from "./edit-form";

export const dynamic = "force-dynamic";

export default async function EditInnovation({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await adminDb().from("innovations").select("id,title,summary,description,category,tags,video_url,published").eq("id", id).maybeSingle();
  if (!data) notFound();
  return (
    <section aria-labelledby="edit-h">
      <p><Link href="/admin/biblioteka" className="underline">← Wróć do listy</Link></p>
      <h1 id="edit-h" className="mt-3 text-2xl font-semibold">Edytuj innowację</h1>
      <EditForm inn={data} />
    </section>
  );
}
