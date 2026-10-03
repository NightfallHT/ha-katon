"use server";

import { cookies } from "next/headers";
import { createBrowserClient, createServerClient } from "@/lib/supabase";

export type SubmitResult = { ok: boolean; message: string };

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const AUTHOR_NAME: Record<string, string> = {
  mieszkaniec: "Halina",
  ngo: "Anna K.",
  gmina: "Wójt gminy demo",
  ekspert: "Ekspert demo",
  admin: "Pracownik ROPS",
};

function db() {
  return createServerClient() ?? createBrowserClient();
}

async function notify(submissionId: string) {
  try {
    await fetch(`${SITE_URL}/api/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "new_submission", submission_id: submissionId }),
    });
  } catch {
    /* email is best effort */
  }
}

async function author() {
  const jar = await cookies();
  const role = jar.get("role")?.value ?? "ngo";
  const email = jar.get("demo_email")?.value ?? "anna.k@razem-blizej.demo";
  return { role, email, name: AUTHOR_NAME[role] ?? "Anna K." };
}

export async function submitFiszka(input: {
  type: "idea" | "good_practice";
  title: string;
  problem: string;
  solution: string;
  target_group: string;
  stage: string;
  location: string;
}): Promise<SubmitResult> {
  const title = input.title.trim();
  if (!title || !input.problem.trim() || !input.solution.trim() || !input.target_group.trim() || !input.location.trim()) {
    return { ok: false, message: "Uzupełnij jeszcze kilka odpowiedzi." };
  }
  const client = db();
  if (!client) {
    return { ok: true, message: "Zapisano na tym komputerze. Baza ROPS nie jest podłączona w tym środowisku." };
  }
  const who = await author();
  const { data, error } = await client
    .from("submissions")
    .insert({
      type: input.type,
      title,
      author_name: who.name,
      author_email: who.email,
      author_role: who.role,
      payload: {
        problem: input.problem.trim(),
        solution: input.solution.trim(),
        target_group: input.target_group.trim(),
        stage: input.stage,
        location: input.location.trim(),
      },
    })
    .select("id")
    .single();
  if (error || !data) {
    return { ok: false, message: "Nie udało się wysłać zgłoszenia. Spróbuj ponownie za chwilę." };
  }
  await notify(data.id);
  return { ok: true, message: "Zgłoszenie trafiło do pracowników ROPS." };
}

export async function submitGrant(input: {
  title: string;
  callName: string;
  problem: string;
  solution: string;
  sections: { cel: string; grupa_docelowa: string; dzialania: string; rezultaty: string };
  budget: { item: string; category: string; amount: number }[];
}): Promise<SubmitResult> {
  const client = db();
  if (!client) {
    return { ok: true, message: "Zapisano na tym komputerze. Baza ROPS nie jest podłączona w tym środowisku." };
  }
  const who = await author();
  let callId: string | undefined;
  const found = await client.from("calls").select("id").eq("name", input.callName).maybeSingle();
  if (found.data?.id) callId = found.data.id;
  const { data, error } = await client
    .from("submissions")
    .insert({
      type: "grant_application",
      title: input.title.trim(),
      author_name: who.name,
      author_email: who.email,
      author_role: who.role,
      call_id: callId ?? null,
      payload: {
        fiszka: { problem: input.problem, solution: input.solution },
        sections: input.sections,
        budget: input.budget,
        accepted_regulamin: true,
      },
    })
    .select("id")
    .single();
  if (error || !data) {
    return { ok: false, message: "Nie udało się wysłać wniosku. Spróbuj ponownie za chwilę." };
  }
  await notify(data.id);
  return { ok: true, message: "Wniosek trafił do pracowników ROPS." };
}
