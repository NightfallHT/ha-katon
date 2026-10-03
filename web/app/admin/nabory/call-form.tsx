"use client";

import { useActionState } from "react";
import { saveCall } from "./actions";

type Call = { id: string; name: string; description: string | null; is_open: boolean; deadline: string | null; budget_max: number | null };

export function CallForm({ call }: { call: Call }) {
  const [state, action, pending] = useActionState(saveCall.bind(null, call.id), null);
  const p = `call-${call.id}`;
  return (
    <form action={action} className="rounded-lg border p-5">
      <h2 className="text-xl font-semibold">{call.name}</h2>
      {call.description && <p className="mt-1">{call.description}</p>}
      <div className="mt-4 flex flex-wrap items-end gap-4">
        <div className="flex min-h-11 items-center gap-2">
          <input id={`${p}-open`} name="is_open" type="checkbox" defaultChecked={call.is_open} className="size-5" />
          <label htmlFor={`${p}-open`} className="font-medium">Nabór otwarty (pokazuje generator wniosku w Kreatorze)</label>
        </div>
        <div>
          <label htmlFor={`${p}-deadline`} className="block font-medium">Termin</label>
          <input id={`${p}-deadline`} name="deadline" type="date" defaultValue={call.deadline ?? ""} className="mt-1 min-h-11 rounded-md border px-3" />
        </div>
        <div>
          <label htmlFor={`${p}-budget`} className="block font-medium">Budżet maksymalny (zł)</label>
          <input id={`${p}-budget`} name="budget_max" type="number" min={0} step={1} defaultValue={call.budget_max ?? ""} className="mt-1 min-h-11 rounded-md border px-3" />
        </div>
        <button type="submit" disabled={pending} className="min-h-11 rounded-md border px-4 py-2 font-medium focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60">Zapisz</button>
      </div>
      <p role="status" aria-live="polite" className="mt-2">{pending ? "Zapisuję…" : state?.message}</p>
    </form>
  );
}
