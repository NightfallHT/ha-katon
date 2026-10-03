import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { adminDb } from "../../admin/_lib/supabase";

// POST /api/submit  (used by the Kreator)
// body: { type: 'idea' | 'good_practice' | 'grant_application', title, payload, author_name?, author_email?, author_role?, call_id? }
// Inserts the submission, emails the admin, returns { ok: true, id }. Payload shapes: AGENTS.md section 6.
const TYPES = ["idea", "good_practice", "grant_application"];

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      type?: string;
      title?: string;
      payload?: Record<string, unknown>;
      author_name?: string;
      author_email?: string;
      author_role?: string;
      call_id?: string;
    };
    const jar = await cookies();
    const email = (body.author_email || jar.get("demo_email")?.value || "").trim();
    const role = body.author_role || jar.get("role")?.value || null;
    const title = (body.title ?? "").trim();

    if (!body.type || !TYPES.includes(body.type)) return NextResponse.json({ error: "Nieprawidłowy rodzaj zgłoszenia." }, { status: 400 });
    if (!title) return NextResponse.json({ error: "Wpisz tytuł zgłoszenia." }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Brak poprawnego adresu e-mail autora." }, { status: 400 });

    const { data, error } = await adminDb()
      .from("submissions")
      .insert({
        type: body.type,
        title,
        author_name: body.author_name ?? null,
        author_email: email,
        author_role: role,
        payload: body.payload ?? {},
        call_id: body.call_id ?? null,
      })
      .select("id")
      .single();
    if (error || !data) return NextResponse.json({ error: "Nie udało się zapisać zgłoszenia. Spróbuj ponownie." }, { status: 500 });

    // Email is best effort: the submission is already saved.
    try {
      await fetch(new URL("/api/notify", req.url), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "new_submission", submission_id: data.id }),
      });
    } catch {
      /* ignore */
    }
    return NextResponse.json({ ok: true, id: data.id });
  } catch {
    return NextResponse.json({ error: "Nie udało się zapisać zgłoszenia. Spróbuj ponownie." }, { status: 500 });
  }
}
