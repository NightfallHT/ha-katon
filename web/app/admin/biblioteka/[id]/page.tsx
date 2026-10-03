import Link from "next/link";
import { notFound } from "next/navigation";
import { getInnovation } from "@/content/catalog";
import { adminDb } from "../../_lib/supabase";
import { EditForm } from "./edit-form";

export const dynamic = "force-dynamic";

export default async function EditInnovation({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let data: {
    id: string;
    title: string;
    summary: string;
    description: string | null;
    category: string;
    tags: string[] | null;
    video_url: string | null;
    published: boolean;
  } | null = null;
  try {
    const found = await adminDb()
      .from("innovations")
      .select("id,title,summary,description,category,tags,video_url,published")
      .eq("id", id)
      .maybeSingle();
    data = found.data;
  } catch {
    data = null;
  }
  if (!data) {
    const local = getInnovation(id);
    if (!local) notFound();
    data = { ...local, published: true };
  }
  return (
    <section aria-labelledby="edit-h">
      <p><Link href="/admin/biblioteka" className="underline">← Wróć do listy</Link></p>
      <h1 id="edit-h" className="mt-3 text-2xl font-semibold">Edytuj innowację</h1>
      <EditForm inn={data} />
    </section>
  );
}
