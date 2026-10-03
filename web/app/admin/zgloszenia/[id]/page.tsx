import Link from "next/link";
import { notFound } from "next/navigation";
import { demoMessagesFor, demoSubmissionById } from "@/content/demo-submissions";
import { adminDb } from "../../_lib/supabase";
import { CATEGORY_LABELS, STATUS_LABELS, TYPE_LABELS, formatDate, label } from "../../_lib/labels";
import { PayloadView } from "./payload";
import { EnrichButton, PublishButton, ReplyForm, StatusForm } from "./forms";

export const dynamic = "force-dynamic";

export default async function SubmissionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let s: Record<string, unknown> | null = null;
  let msgs: Array<Record<string, string>> = [];
  let demo = false;
  try {
    const db = adminDb();
    const found = await db.from("submissions").select("*").eq("id", id).maybeSingle();
    s = found.data;
    if (s) {
      const thread = await db
        .from("messages")
        .select("*")
        .eq("submission_id", id)
        .order("created_at", { ascending: true });
      msgs = thread.data ?? [];
    }
  } catch {
    /* fall through to demo rows */
  }
  if (!s) {
    const local = demoSubmissionById(id);
    if (!local) notFound();
    s = local;
    msgs = demoMessagesFor(id);
    demo = true;
  }
  const canPublish = ["idea", "good_practice"].includes(String(s.type));

  return (
    <article aria-labelledby="tytul">
      <p><Link href="/admin/zgloszenia" className="underline">← Wróć do listy zgłoszeń</Link></p>
      <h1 id="tytul" className="mt-3 text-2xl font-semibold">{String(s.title)}</h1>
      {demo ? (
        <p role="status" className="mt-2 rounded-md border p-3">
          Widok poglądowy. Gdy baza działa, tu zapiszesz decyzję i odpowiedź.
        </p>
      ) : null}
      <p className="mt-2">
        {label(TYPE_LABELS, String(s.type))} · {String(s.author_name || "—")} ({String(s.author_email)}) · {formatDate(String(s.created_at))} ·{" "}
        <span className="rounded-full border px-2 py-1 text-sm font-semibold">{label(STATUS_LABELS, String(s.status))}</span>
      </p>
      {s.innovation_id ? (
        <p className="mt-2"><Link href={`/biblioteka/${String(s.innovation_id)}`} className="underline">Zobacz w Bibliotece</Link></p>
      ) : null}

      <section aria-labelledby="tresc" className="mt-8">
        <h2 id="tresc" className="text-xl font-semibold">Treść zgłoszenia</h2>
        <div className="mt-3"><PayloadView payload={(s.payload ?? {}) as Record<string, unknown>} /></div>
      </section>

      <section aria-labelledby="ai" className="mt-8">
        <h2 id="ai" className="text-xl font-semibold">Podsumowanie AI</h2>
        {s.ai_summary ? (
          <dl className="mt-3 space-y-2">
            <div><dt className="font-medium">Streszczenie</dt><dd>{String(s.ai_summary)}</dd></div>
            <div><dt className="font-medium">Kategoria</dt><dd>{label(CATEGORY_LABELS, String(s.ai_category ?? ""))}</dd></div>
            <div><dt className="font-medium">Tagi</dt><dd>{(Array.isArray(s.ai_tags) ? s.ai_tags : []).join(", ") || "—"}</dd></div>
          </dl>
        ) : (
          <p className="mt-2">Jeszcze nie przygotowano podsumowania.</p>
        )}
        {demo ? null : (
          <div className="mt-3"><EnrichButton id={id} /></div>
        )}
      </section>

      <section aria-labelledby="status-h" className="mt-8">
        <h2 id="status-h" className="text-xl font-semibold">Decyzja</h2>
        {demo ? (
          <p className="mt-3">W demo status zostaje: {label(STATUS_LABELS, String(s.status))}.</p>
        ) : (
          <>
            <div className="mt-3"><StatusForm id={id} current={String(s.status)} /></div>
            {canPublish ? <div className="mt-4"><PublishButton id={id} published={Boolean(s.innovation_id)} /></div> : null}
          </>
        )}
      </section>

      <section aria-labelledby="rozmowa" className="mt-8">
        <h2 id="rozmowa" className="text-xl font-semibold">Rozmowa z autorem</h2>
        <ul className="mt-3 space-y-3">
          {msgs.map((m) => (
            <li key={m.id} className="rounded-md border p-3">
              <p className="font-medium">{m.sender === "admin" ? "ROPS" : "Autor"} · {formatDate(m.created_at)}</p>
              <p className="whitespace-pre-wrap">{m.body}</p>
            </li>
          ))}
          {msgs.length === 0 && <li>Brak wiadomości.</li>}
        </ul>
        {demo ? null : <div className="mt-4"><ReplyForm id={id} /></div>}
      </section>
    </article>
  );
}
