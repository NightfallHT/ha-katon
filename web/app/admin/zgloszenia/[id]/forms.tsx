"use client";

import { useActionState } from "react";
import { STATUS_LABELS } from "../../_lib/labels";
import { enrichSubmission, publishToLibrary, sendReply, updateStatus, type ActionResult } from "./actions";

const btn = "min-h-11 rounded-md border px-4 py-2 font-medium focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60";

function Result({ state, pending, pendingText }: { state: ActionResult | null; pending: boolean; pendingText: string }) {
  return (
    <p role="status" aria-live="polite" className="mt-2">
      {pending ? pendingText : state?.message}
    </p>
  );
}

export function EnrichButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(enrichSubmission.bind(null, id), null);
  return (
    <form action={action}>
      <button type="submit" disabled={pending} className={btn}>Uzupełnij przez AI</button>
      <Result state={state} pending={pending} pendingText="AI przygotowuje podsumowanie…" />
    </form>
  );
}

export function StatusForm({ id, current }: { id: string; current: string }) {
  const [state, action, pending] = useActionState(updateStatus.bind(null, id), null);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div>
        <label htmlFor="status" className="block font-medium">Status</label>
        <select id="status" name="status" defaultValue={current} className="mt-1 min-h-11 rounded-md border px-3">
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
      <button type="submit" disabled={pending} className={btn}>Zapisz status</button>
      <Result state={state} pending={pending} pendingText="Zapisuję…" />
    </form>
  );
}

export function ReplyForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(sendReply.bind(null, id), null);
  return (
    <form action={action}>
      <label htmlFor="body" className="block font-medium">Twoja odpowiedź <span className="font-normal">(wymagane)</span></label>
      <textarea id="body" name="body" required rows={4} className="mt-1 w-full rounded-md border p-3" />
      <button type="submit" disabled={pending} className={`${btn} mt-3`}>Wyślij odpowiedź</button>
      <Result state={state} pending={pending} pendingText="Wysyłam odpowiedź…" />
    </form>
  );
}

// Stays mounted after publishing, so the result message does not vanish when the page re-renders.
export function PublishButton({ id, published }: { id: string; published: boolean }) {
  const [state, action, pending] = useActionState(publishToLibrary.bind(null, id), null);
  return (
    <form action={action}>
      <button type="submit" disabled={pending || published} className={btn}>
        {published ? "Opublikowano w Bibliotece" : "Opublikuj w Bibliotece"}
      </button>
      <Result state={state} pending={pending} pendingText="Publikuję i odświeżam dopasowania…" />
    </form>
  );
}
