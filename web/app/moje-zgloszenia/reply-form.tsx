"use client";

import { useActionState } from "react";
import { replyAsAuthor } from "./actions";

export function AuthorReplyForm({ submissionId }: { submissionId: string }) {
  const [state, action, pending] = useActionState(replyAsAuthor.bind(null, submissionId), null);
  const id = `reply-${submissionId}`;
  return (
    <form action={action} className="mt-3">
      <label htmlFor={id} className="block font-medium">Napisz odpowiedź</label>
      <textarea id={id} name="body" required rows={3} className="mt-1 w-full rounded-md border p-3" />
      <button type="submit" disabled={pending} className="mt-2 min-h-11 rounded-md border px-4 py-2 font-medium focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60">
        Wyślij
      </button>
      <p role="status" aria-live="polite" className="mt-2">{pending ? "Wysyłam…" : state?.message}</p>
    </form>
  );
}
