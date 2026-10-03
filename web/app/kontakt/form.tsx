"use client";

import { useActionState } from "react";
import { sendContact } from "./actions";

const field = "mt-1 w-full rounded-md border p-3";

export function ContactForm({ defaultName, defaultEmail, defaultMessage, defaultPage }: { defaultName: string; defaultEmail: string; defaultMessage: string; defaultPage: string }) {
  const [state, action, pending] = useActionState(sendContact, null);
  const errId = "contact-error";
  return (
    <form action={action} className="mt-6 space-y-4" aria-describedby={state && !state.ok ? errId : undefined}>
      <div>
        <label htmlFor="c-name" className="block font-medium">Imię <span className="font-normal">(wymagane)</span></label>
        <input id="c-name" name="name" required autoComplete="given-name" defaultValue={defaultName} className={field} />
      </div>
      <div>
        <label htmlFor="c-email" className="block font-medium">E-mail <span className="font-normal">(wymagane)</span></label>
        <input id="c-email" name="email" type="email" required autoComplete="email" defaultValue={defaultEmail} className={field} />
      </div>
      <div>
        <label htmlFor="c-message" className="block font-medium">Wiadomość <span className="font-normal">(wymagane)</span></label>
        <textarea id="c-message" name="message" required rows={6} defaultValue={defaultMessage} className={field} />
      </div>
      <div>
        <label htmlFor="c-page" className="block font-medium">Strona, której dotyczy pytanie <span className="font-normal">(opcjonalne)</span></label>
        <input id="c-page" name="page" defaultValue={defaultPage} className={field} />
      </div>
      <button type="submit" disabled={pending} className="min-h-11 rounded-md border px-5 py-2 font-medium focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60">
        Wyślij wiadomość
      </button>
      <p role="status" aria-live="polite" id={state && !state.ok ? errId : undefined}>
        {pending ? "Wysyłam wiadomość…" : state?.message}
      </p>
    </form>
  );
}
