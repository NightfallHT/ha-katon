import { NextResponse } from "next/server";
import { Resend } from "resend";
import { adminDb } from "../../admin/_lib/supabase";

// POST { type: 'new_submission' | 'admin_reply', submission_id }
// Never fails the caller: a missing key or a send error is logged and returns ok.
export async function POST(req: Request) {
  try {
    const { type, submission_id } = (await req.json()) as { type?: string; submission_id?: string };
    if (!submission_id || (type !== "new_submission" && type !== "admin_reply")) {
      return NextResponse.json({ error: "Nieprawidłowe zapytanie." }, { status: 400 });
    }
    const { data: s } = await adminDb().from("submissions").select("id,title,author_email").eq("id", submission_id).maybeSingle();
    if (!s) return NextResponse.json({ error: "Nie znaleziono zgłoszenia." }, { status: 404 });

    const site = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;
    const mail =
      type === "new_submission"
        ? {
            to: process.env.ADMIN_NOTIFY_EMAIL,
            subject: `Nowe zgłoszenie: ${s.title}`,
            text: `Wpłynęło nowe zgłoszenie: ${s.title}\n\n${site}/admin/zgloszenia/${s.id}`,
          }
        : {
            to: s.author_email,
            subject: `Odpowiedź ROPS w sprawie: ${s.title}`,
            text: `Pracownik ROPS odpowiedział w sprawie: ${s.title}\n\n${site}/moje-zgloszenia`,
          };

    const key = process.env.RESEND_API_KEY;
    if (!key || !mail.to) {
      console.log("[notify] email skipped (missing RESEND_API_KEY or recipient):", mail.subject);
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
