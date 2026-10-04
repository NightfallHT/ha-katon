// Grant calls for public pages. Reads the `calls` table so the open/closed toggle in
// /admin/nabory shows up on /wyzwania and /kreator; falls back to the seed JSON when
// the database is not configured or empty. Server-only: uses the service-role client.
import { adminDb } from "@/app/admin/_lib/supabase";
import { calls as seedCalls } from "@/content/catalog";

export type CallView = {
  name: string;
  description: string | null;
  is_open: boolean;
  deadline: string | null;
  budget_max: number | null;
  regulamin_url: string | null;
};

export async function getCalls(): Promise<CallView[]> {
  try {
    const { data, error } = await adminDb()
      .from("calls")
      .select("name,description,is_open,deadline,budget_max,regulamin_url");
    if (error || !data?.length) throw new Error(error?.message ?? "empty");
    return (data as CallView[]).map((c) => ({ ...c, budget_max: c.budget_max === null ? null : Number(c.budget_max) }));
  } catch {
    return seedCalls;
  }
}

const today = () => new Date().toISOString().slice(0, 10);

/** Open calls, soonest deadline first. */
export function openCalls(calls: CallView[]) {
  return calls.filter((c) => c.is_open).sort((a, b) => (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999"));
}

/** Closed calls whose deadline is still ahead, soonest first: "the next call". */
export function upcomingCalls(calls: CallView[]) {
  return calls
    .filter((c) => !c.is_open && c.deadline && c.deadline >= today())
    .sort((a, b) => a.deadline!.localeCompare(b.deadline!));
}

/** Closed calls whose deadline has passed, most recent first. */
export function pastCalls(calls: CallView[]) {
  return calls
    .filter((c) => !c.is_open && (!c.deadline || c.deadline < today()))
    .sort((a, b) => (b.deadline ?? "").localeCompare(a.deadline ?? ""));
}

export function deadlineLabel(iso: string | null) {
  if (!iso) return "bez podanego terminu";
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("pl-PL", { dateStyle: "long" }).format(date);
}

export function budgetLabel(amount: number | null) {
  return amount === null ? "zgodnie z regulaminem" : `${amount.toLocaleString("pl-PL")} zł`;
}
