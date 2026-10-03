import { cookies } from "next/headers";
import Link from "next/link";
import { DEMO_MESSAGES, DEMO_SUBMISSIONS } from "@/content/demo-submissions";
import { adminDb } from "../admin/_lib/supabase";
import { TYPE_LABELS, formatDate, label } from "../admin/_lib/labels";
import { setDemoEmail } from "./actions";
import { AuthorReplyForm } from "./reply-form";
import { LocalLastSubmission } from "./local-last";

export const dynamic = "force-dynamic";
export const metadata = { title: "Moje zgłoszenia | Hub Innowacji Społecznych" };

const STEPS = ["Wysłane", "W ocenie", "Decyzja"];
function stepOf(status: string) {
  if (status === "nowe") return 0;
  if (status === "w_ocenie") return 1;
  return 2;
}
const DECISION: Record<string, string> = { zaakceptowane: "Decyzja: zaakceptowane", odrzucone: "Decyzja: odrzucone" };

export default async function MySubmissions() {
  const email = (await cookies()).get("demo_email")?.value;

  if (!email) {
    return (
      <section aria-labelledby="mz-h">
        <h1 id="mz-h" className="text-3xl font-semibold">Moje zgłoszenia</h1>
        <p className="mt-3">Podaj adres e-mail, z którego wysyłasz zgłoszenia, aby zobaczyć ich status.</p>
        <form action={setDemoEmail} className="mt-4 max-w-md">
          <label htmlFor="mz-email" className="block font-medium">E-mail <span className="font-normal">(wymagane)</span></label>
          <input id="mz-email" name="email" type="email" required autoComplete="email" className="mt-1 w-full rounded-md border p-3" />
          <button type="submit" className="mt-3 min-h-11 rounded-md border px-4 py-2 font-medium focus-visible:ring-2 focus-visible:ring-ring">Pokaż moje zgłoszenia</button>
        </form>
        <LocalLastSubmission />
      </section>
    );
  }

  let subs: Array<Record<string, string>> = [];
  let msgs: Array<Record<string, string>> = [];
  let error = "";
  try {
    const db = adminDb();
    const res = await db.from("submissions").select("id,type,title,status,created_at").eq("author_email", email).order("created_at", { ascending: false });
    if (res.error) throw new Error(res.error.message);
    subs = res.data ?? [];
    if (subs.length) {
      const m = await db.from("messages").select("id,submission_id,sender,body,created_at").in("submission_id", subs.map((s) => s.id)).order("created_at", { ascending: true });
      msgs = m.data ?? [];
    }
  } catch {
    error = "Widok poglądowy — baza ROPS nie jest podłączona w tym środowisku.";
    const demo = DEMO_SUBMISSIONS.filter((item) => item.author_email === email);
    subs = (demo.length ? demo : DEMO_SUBMISSIONS).map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      status: item.status,
      created_at: item.created_at,
    }));
    msgs = DEMO_MESSAGES.filter((m) => subs.some((s) => s.id === m.submission_id)).map((m) => ({
      id: m.id,
      submission_id: m.submission_id,
      sender: m.sender,
      body: m.body,
      created_at: m.created_at,
    }));
  }

  return (
    <section aria-labelledby="mz-h">
      <h1 id="mz-h" className="text-3xl font-semibold">Moje zgłoszenia</h1>
      <p className="mt-2">Zgłoszenia wysłane z adresu {email}.</p>
      {error && <p role="status" className="mt-4 rounded-md border p-3">{error}</p>}
      {!error && subs.length === 0 && (
        <p className="mt-4">Nie masz jeszcze zgłoszeń. <Link href="/kontakt" className="underline">Napisz do ROPS</Link>.</p>
      )}
      <ul className="mt-6 space-y-8">
        {subs.map((s) => {
          const step = stepOf(s.status);
          const thread = msgs.filter((m) => m.submission_id === s.id);
          return (
            <li key={s.id} className="rounded-lg border p-5">
              <h2 className="text-xl font-semibold">{s.title}</h2>
              <p className="mt-1">{label(TYPE_LABELS, s.type)} · {formatDate(s.created_at)}</p>
              <ol aria-label="Etapy zgłoszenia" className="mt-4 flex flex-wrap gap-2">
                {STEPS.map((t, i) => (
                  <li
                    key={t}
                    aria-current={i === step ? "step" : undefined}
                    className={`rounded-md border px-3 py-2 ${i === step ? "bg-foreground font-semibold text-background" : ""}`}
                  >
                    {i + 1}. {i === 2 && DECISION[s.status] ? DECISION[s.status] : t}
                    {i < step && <span className="sr-only"> (zakończone)</span>}
                    {i === step && <span className="sr-only"> (obecny etap)</span>}
                  </li>
                ))}
              </ol>
              <h3 className="mt-5 font-semibold">Rozmowa z ROPS</h3>
              <ul className="mt-2 space-y-2">
                {thread.map((m) => (
                  <li key={m.id} className="rounded-md border p-3">
                    <p className="font-medium">{m.sender === "admin" ? "ROPS" : "Ty"} · {formatDate(m.created_at)}</p>
                    <p className="whitespace-pre-wrap">{m.body}</p>
                  </li>
                ))}
                {thread.length === 0 && <li>Nie ma jeszcze wiadomości.</li>}
              </ul>
              {error ? null : <AuthorReplyForm submissionId={s.id} />}
            </li>
          );
        })}
      </ul>
      <LocalLastSubmission />
    </section>
  );
}
