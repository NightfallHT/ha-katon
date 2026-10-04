"use client";

import { useActionState, useState } from "react";
import { STATUS_LABELS } from "../../_lib/labels";
import { SaveButton } from "../../_lib/save-button";
import {
  enrichSubmission,
  publishToLibrary,
  sendReply,
  updateStatus,
  type ActionResult,
} from "./actions";

function Result({
  state,
  pending,
  pendingText,
}: {
  state: ActionResult | null;
  pending: boolean;
  pendingText: string;
}) {
  if (!pending && !state) return null;
  return (
    <p
      role={state && !state.ok ? "alert" : "status"}
      aria-live="polite"
      className={
        state && !state.ok
          ? "admin-save__result admin-save__result--bad"
          : "admin-save__result"
      }
    >
      {pending ? pendingText : state?.message}
    </p>
  );
}

export function EnrichButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(enrichSubmission.bind(null, id), null);
  return (
    <form action={action} className="admin-action">
      <button type="submit" disabled={pending} className="secondary-action">
        {pending ? "AI przygotowuje podsumowanie…" : "Uzupełnij przez AI"}
      </button>
      <Result state={state} pending={pending} pendingText="AI przygotowuje podsumowanie…" />
    </form>
  );
}

export function StatusForm({ id, current }: { id: string; current: string }) {
  const [state, action, pending] = useActionState(updateStatus.bind(null, id), null);
  const [status, setStatus] = useState(current);

  // After a save the stored status is the one we just sent.
  const baseline = state?.saved ?? current;

  return (
    <form action={action} className="admin-form">
      <p className="admin-field">
        <label htmlFor="status">Status zgłoszenia</label>
        <select
          id="status"
          name="status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="admin-select"
        >
          {Object.entries(STATUS_LABELS).map(([key, text]) => (
            <option key={key} value={key}>
              {text}
            </option>
          ))}
        </select>
      </p>
      <SaveButton
        label="Zapisz status"
        pendingLabel="Zapisuję…"
        pending={pending}
        dirty={status !== baseline}
        missing={[]}
        result={state}
        idleHint={`Zapisany status: ${STATUS_LABELS[baseline] ?? baseline}.`}
      />
    </form>
  );
}

// Keyed on the last successful send, so a sent reply leaves an empty box
// instead of the text the author already received.
export function ReplyForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(sendReply.bind(null, id), null);
  return (
    <form action={action} className="admin-form">
      <ReplyBody key={state?.sentAt ?? "new"} pending={pending} state={state} />
    </form>
  );
}

function ReplyBody({
  pending,
  state,
}: {
  pending: boolean;
  state: ActionResult | null;
}) {
  const [body, setBody] = useState("");
  return (
    <>
      <div className="admin-field">
        <label htmlFor="body">
          Twoja odpowiedź <span className="admin-field__hint">(wymagane)</span>
        </label>
        <p className="admin-field__hint">
          Trafi do autora e-mailem i zostanie w historii rozmowy.
        </p>
        <textarea
          id="body"
          name="body"
          required
          rows={4}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          className="admin-input admin-input--wide"
        />
      </div>
      <SaveButton
        label="Wyślij odpowiedź"
        pendingLabel="Wysyłam odpowiedź…"
        pending={pending}
        dirty={body.trim().length > 0}
        missing={[]}
        result={state}
        idleHint="Napisz odpowiedź, żeby ją wysłać."
      />
    </>
  );
}

// Stays mounted after publishing, so the result message does not vanish when the page re-renders.
export function PublishButton({ id, published }: { id: string; published: boolean }) {
  const [state, action, pending] = useActionState(publishToLibrary.bind(null, id), null);
  const done = published || Boolean(state?.ok);
  return (
    <form action={action} className="admin-action">
      <button
        type="submit"
        disabled={pending || done}
        className="admin-primary-action"
      >
        {done ? "Opublikowano w Bibliotece" : "Opublikuj w Bibliotece"}
      </button>
      {done && !state ? (
        <p className="admin-save__hint">
          Ta innowacja jest już widoczna dla mieszkańców.
        </p>
      ) : null}
      <Result state={state} pending={pending} pendingText="Publikuję i odświeżam dopasowania…" />
    </form>
  );
}
