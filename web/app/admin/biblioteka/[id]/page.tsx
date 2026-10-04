import Link from "next/link";
import { notFound } from "next/navigation";
import { getInnovation } from "@/content/catalog";
import { adminDb } from "../../_lib/supabase";
import { VisibilityBadge } from "../../_lib/status";
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
    <section aria-labelledby="edit-h" className="admin-page">
      <p>
        <Link href="/admin/biblioteka" className="admin-back">
          ← Wróć do listy innowacji
        </Link>
      </p>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Biblioteka</p>
          <h1 id="edit-h">{data.title}</h1>
          <p className="admin-page__lead">
            Edytujesz kartę innowacji. Przycisk zapisu włączy się, gdy coś
            zmienisz.
          </p>
        </div>
        <VisibilityBadge published={data.published} />
      </div>
      <EditForm inn={data} />
    </section>
  );
}
