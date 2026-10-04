import { NextResponse } from "next/server";
import { Resend } from "resend";
import { adminDb } from "../../admin/_lib/supabase";

// POST { type: 'new_submission' | 'admin_reply' | 'grant_receipt', submission_id }
//   new_submission → admin: a new submission arrived
//   admin_reply    → author: the latest ROPS reply, quoted in full
//   grant_receipt  → author: every detail of the grant application they just sent
// Never fails the caller: a missing key or a send error is logged and returns ok with sent: false.
const TYPES = ["new_submission", "admin_reply", "grant_receipt"] as const;
type MailType = (typeof TYPES)[number];

type Section = { cel?: string; grupa_docelowa?: string; dzialania?: string; rezultaty?: string };
type BudgetRow = { item?: string; category?: string; amount?: number };
type GrantPayload = {
  fiszka?: { problem?: string; solution?: string; target_group?: string };
  sections?: Section;
  budget?: BudgetRow[];
};

const zl = (n: number) => `${n.toLocaleString("pl-PL")} zł`;

function grantReceipt(s: { title: string; author_name: string | null }, callName: string | null, p: GrantPayload) {
  const sections = p.sections ?? {};
  const budget = p.budget ?? [];
  const total = budget.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  return [
    `Dzień dobry${s.author_name ? `, ${s.author_name}` : ""}!`,
    "",
    `Otrzymaliśmy Twój wniosek „${s.title}”. Pracownicy ROPS odpowiedzą na ten adres e-mail.`,
    callName ? `Nabór: ${callName}` : "",
    "",
    "— Problem —",
    p.fiszka?.problem ?? "",
    "",
    "— Pomysł —",
    p.fiszka?.solution ?? "",
    p.fiszka?.target_group ? `\nDla kogo: ${p.fiszka.target_group}` : "",
    "",
    "— Cel —",
    sections.cel ?? "",
    "",
    "— Grupa docelowa —",
    sections.grupa_docelowa ?? "",
    "",
    "— Działania —",
    sections.dzialania ?? "",
    "",
    "— Rezultaty —",
    sections.rezultaty ?? "",
    "",
    "— Budżet —",
    ...budget.map((row) => `• ${row.item ?? ""} (${row.category ?? ""}): ${zl(Number(row.amount) || 0)}`),
    `Razem: ${zl(total)}`,
    "",
    "Hub Innowacji Społecznych, ROPS Kraków",
  ]
    .filter((line, i, all) => !(line === "" && all[i - 1] === ""))
    .join("\n");
}

export async function POST(req: Request) {
  try {
    const { type, submission_id } = (await req.json()) as { type?: string; submission_id?: string };
    if (!submission_id || !TYPES.includes(type as MailType)) {
      return NextResponse.json({ error: "Nieprawidłowe zapytanie." }, { status: 400 });
    }
    const db = adminDb();
    const { data: s } = await db
      .from("submissions")
      .select("id,title,author_name,author_email,payload,call_id")
      .eq("id", submission_id)
      .maybeSingle();
    if (!s) return NextResponse.json({ error: "Nie znaleziono zgłoszenia." }, { status: 404 });

    const site = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;
    let mail: { to?: string | null; subject: string; text: string };
    if (type === "new_submission") {
      mail = {
        to: process.env.ADMIN_NOTIFY_EMAIL,
        subject: `Nowe zgłoszenie: ${s.title}`,
        text: `Wpłynęło nowe zgłoszenie: ${s.title}\n\n${site}/admin/zgloszenia/${s.id}`,
      };
    } else if (type === "admin_reply") {
      const { data: reply } = await db
        .from("messages")
        .select("body")
        .eq("submission_id", s.id)
        .eq("sender", "admin")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      mail = {
        to: s.author_email,
        subject: `Odpowiedź ROPS w sprawie: ${s.title}`,
        text: [
          `Pracownik ROPS odpowiedział w sprawie: ${s.title}`,
          reply?.body ? `\n${reply.body}` : "",
          `\nAby odpowiedzieć, napisz przez formularz: ${site}/kontakt`,
        ]
          .filter(Boolean)
          .join("\n"),
      };
    } else {
      const { data: call } = s.call_id
        ? await db.from("calls").select("name").eq("id", s.call_id).maybeSingle()
        : { data: null };
      mail = {
        to: s.author_email,
        subject: `Potwierdzenie: ${s.title}`,
        text: grantReceipt(s, call?.name ?? null, (s.payload ?? {}) as GrantPayload),
      };
    }

    const key = process.env.RESEND_API_KEY;
    if (!key || !mail.to) {
      console.log("[notify] email skipped (missing RESEND_API_KEY or recipient):", mail.subject);
      // Local preview of what would have been sent; never logged in production (contains personal data).
      if (process.env.NODE_ENV !== "production") console.log(`[notify] to: ${mail.to ?? "—"}\n${mail.text}`);
      return NextResponse.json({ ok: true, sent: false });
    }
    const { error } = await new Resend(key).emails.send({
      from: process.env.NOTIFY_FROM_EMAIL ?? "Hub Innowacji <onboarding@resend.dev>",
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
    });
    if (error) console.error("[notify] send failed:", error);
    return NextResponse.json({ ok: true, sent: !error });
  } catch (e) {
    console.error("[notify] error:", e);
    return NextResponse.json({ ok: true, sent: false });
  }
}
