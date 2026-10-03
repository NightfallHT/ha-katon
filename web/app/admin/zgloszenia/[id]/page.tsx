import Link from "next/link";
import { notFound } from "next/navigation";
import { adminDb } from "../../_lib/supabase";
import { CATEGORY_LABELS, STATUS_LABELS, TYPE_LABELS, formatDate, label } from "../../_lib/labels";
import { PayloadView } from "./payload";
import { EnrichButton, PublishButton, ReplyForm, StatusForm } from "./forms";

export const dynamic = "force-dynamic";

export default async function SubmissionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = adminDb();
  const { data: s } = await db.from("submissions").select("*").eq("id", id).maybeSingle();
  if (!s) notFound();
  const { data: msgs } = await db.from("messages").select("*").eq("submission_id", id).order("created_at", { ascending: true });
  const canPublish = ["idea", "good_practice"].includes(s.type);

  return (
    <article aria-labelledby="tytul">
      <p><Link href="/admin/zgloszenia" className="underline">← Wróć do listy zgłoszeń</Link></p>
      <h1 id="tytul" className="mt-3 text-2xl font-semibold">{s.title}</h1>
      <p className="mt-2">
        {label(TYPE_LABELS, s.type)} · {s.author_name || "—"} ({s.author_email}) · {formatDate(s.created_at)} ·{" "}
        <span className="rounded-full border px-2 py-1 text-sm font-semibold">{label(STATUS_LABELS, s.status)}</span>
      </p>
      {s.innovation_id && (
        <p className="mt-2"><Link href={`/biblioteka/${s.innovation_id}`} className="underline">Zobacz w Bibliotece</Link></p>
      )}

      <section aria-labelledby="tresc" className="mt-8">
        <h2 id="tresc" className="text-xl font-semibold">Treść zgłoszenia</h2>
        <div className="mt-3"><PayloadView payload={(s.payload ?? {}) as Record<string, unknown>} /></div>
      </section>

      <section aria-labelledby="ai" className="mt-8">
        <h2 id="ai" className="text-xl font-semibold">Podsumowanie AI</h2>
        {s.ai_summary ? (
          <dl className="mt-3 space-y-2">
            <div><dt className="font-medium">Streszczenie</dt><dd>{s.ai_summary}</dd></div>
            <div><dt className="font-medium">Kategoria</dt><dd>{label(CATEGORY_LABELS, s.ai_category)}</dd></div>
            <div><dt className="font-medium">Tagi</dt><dd>{(s.ai_tags ?? []).join(", ") || "—"}</dd></div>
          </dl>
        ) : (
          <p className="mt-2">Jeszcze nie przygotowano podsumowania.</p>
        )}
        <div className="mt-3"><EnrichButton id={id} /></div>
      </section>

      <section aria-labelledby="status-h" className="mt-8">
        <h2 id="status-h" className="text-xl font-semibold">Decyzja</h2>
        <div className="mt-3"><StatusForm id={id} current={s.status} /></div>
        {canPublish && <div className="mt-4"><PublishButton id={id} published={Boolean(s.innovation_id)} /></div>}
      </section>

      <section aria-labelledby="rozmowa" className="mt-8">
        <h2 id="rozmowa" className="text-xl font-semibold">Rozmowa z autorem</h2>
        <ul className="mt-3 space-y-3">
          {(msgs ?? []).map((m) => (
            <li key={m.id} className="rounded-md border p-3">
              <p className="font-medium">{m.sender === "admin" ? "ROPS" : "Autor"} · {formatDate(m.created_at)}</p>
              <p className="whitespace-pre-wrap">{m.body}</p>
            </li>
          ))}
          {(msgs ?? []).length === 0 && <li>Brak wiadomości.</li>}
        </ul>
        <div className="mt-4"><ReplyForm id={id} /></div>
      </section>
    </article>
  );
}
