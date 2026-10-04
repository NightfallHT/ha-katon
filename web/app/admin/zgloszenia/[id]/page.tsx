import Link from "next/link";
import { notFound } from "next/navigation";
import { demoMessagesFor, demoSubmissionById } from "@/content/demo-submissions";
import { adminDb } from "../../_lib/supabase";
import { CATEGORY_LABELS, STATUS_LABELS, TYPE_LABELS, formatDate, label } from "../../_lib/labels";
import { BackLink } from "../../_lib/back-link";
import { StatusBadge } from "../../_lib/status";
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
    <article aria-labelledby="tytul" className="admin-page">
      <BackLink href="/admin/zgloszenia">Wróć do listy zgłoszeń</BackLink>

      <div className="section-heading">
        <div>
          <p className="eyebrow">{label(TYPE_LABELS, String(s.type))}</p>
          <h1 id="tytul">{String(s.title)}</h1>
        </div>
        <StatusBadge status={String(s.status)} />
      </div>

      {demo ? (
        <p role="status" className="admin-notice">
          Widok poglądowy. Gdy baza działa, tu zapiszesz decyzję i odpowiedź.
        </p>
      ) : null}

      <dl className="admin-meta">
        <div>
          <dt>Autor</dt>
          <dd>{String(s.author_name || "—")}</dd>
        </div>
        <div>
          <dt>E-mail</dt>
          <dd>{String(s.author_email)}</dd>
        </div>
        <div>
          <dt>Wpłynęło</dt>
          <dd>{formatDate(String(s.created_at))}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{label(STATUS_LABELS, String(s.status))}</dd>
        </div>
        {s.innovation_id ? (
          <div>
            <dt>W Bibliotece</dt>
            <dd>
              <Link href={`/biblioteka/${String(s.innovation_id)}`}>Zobacz kartę</Link>
            </dd>
          </div>
        ) : null}
      </dl>

      <section aria-labelledby="tresc" className="admin-card">
        <div className="admin-card__head">
          <h2 id="tresc">Treść zgłoszenia</h2>
          <p className="admin-card__note">To, co wpisał autor</p>
        </div>
        <PayloadView payload={(s.payload ?? {}) as Record<string, unknown>} />
      </section>

      <section aria-labelledby="ai" className="admin-card">
        <div className="admin-card__head">
          <h2 id="ai">Podsumowanie AI</h2>
          <p className="admin-card__note">Propozycja do sprawdzenia, nie decyzja</p>
        </div>
        {s.ai_summary ? (
          <dl className="admin-payload">
            <div>
              <dt>Streszczenie</dt>
              <dd>{String(s.ai_summary)}</dd>
            </div>
            <div>
              <dt>Kategoria</dt>
              <dd>{label(CATEGORY_LABELS, String(s.ai_category ?? ""))}</dd>
            </div>
            <div>
              <dt>Tagi</dt>
              <dd>{(Array.isArray(s.ai_tags) ? s.ai_tags : []).join(", ") || "—"}</dd>
            </div>
          </dl>
        ) : (
          <p className="admin-empty">Jeszcze nie przygotowano podsumowania.</p>
        )}
        {demo ? null : <EnrichButton id={id} />}
      </section>

      <section aria-labelledby="status-h" className="admin-card">
        <div className="admin-card__head">
          <h2 id="status-h">Decyzja</h2>
          <p className="admin-card__note">Status wraca do autora e-mailem</p>
        </div>
        {demo ? (
          <p className="admin-empty">
            W demo status zostaje: {label(STATUS_LABELS, String(s.status))}.
          </p>
        ) : (
          <>
            <StatusForm id={id} current={String(s.status)} />
            {canPublish ? (
              <PublishButton id={id} published={Boolean(s.innovation_id)} />
            ) : null}
          </>
        )}
      </section>

      <section aria-labelledby="rozmowa" className="admin-card">
        <div className="admin-card__head">
          <h2 id="rozmowa">Rozmowa z autorem</h2>
          <p className="admin-card__note">
            {msgs.length} {msgs.length === 1 ? "wiadomość" : "wiadomości"}
          </p>
        </div>
        {msgs.length ? (
          <ul className="admin-thread">
            {msgs.map((m) => (
              <li key={m.id} className={m.sender === "admin" ? "is-rops" : undefined}>
                <p className="admin-thread__who">
                  <span>{m.sender === "admin" ? "ROPS" : "Autor"}</span>
                  <span>{formatDate(m.created_at)}</span>
                </p>
                <p className="admin-thread__body">{m.body}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="admin-empty">Nikt jeszcze nic nie napisał.</p>
        )}
        {demo ? null : <ReplyForm id={id} />}
      </section>
    </article>
  );
}
