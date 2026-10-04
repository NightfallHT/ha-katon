"use client";

import { useActionState } from "react";
import { sendContact } from "./actions";

export function ContactForm({
  defaultName,
  defaultEmail,
  defaultMessage,
  defaultPage,
}: {
  defaultName: string;
  defaultEmail: string;
  defaultMessage: string;
  defaultPage: string;
}) {
  const [state, action, pending] = useActionState(sendContact, null);
  const failed = Boolean(state && !state.ok);

  return (
    <form
      action={action}
      className="contact-form"
      aria-describedby={failed ? "contact-error" : undefined}
    >
      {/* The error lives above the fields so it is read before them, and is a
          live alert so it is announced when it appears. */}
      {failed ? (
        <p id="contact-error" role="alert" className="form-error">
          {state?.message}
        </p>
      ) : null}

      <fieldset className="contact-form__group">
        <legend>
          <span className="contact-form__step" aria-hidden="true">
            1
          </span>
          Twoje dane
        </legend>
        <p className="contact-form__note">
          Potrzebujemy ich tylko po to, żeby odpisać.
        </p>
        <div className="tester-form__grid">
          <div>
            <label htmlFor="c-name">
              Imię <span>(wymagane)</span>
            </label>
            <input
              id="c-name"
              name="name"
              required
              autoComplete="given-name"
              defaultValue={defaultName}
              className="tester-form__field"
            />
          </div>
          <div>
            <label htmlFor="c-email">
              E-mail <span>(wymagane)</span>
            </label>
            <input
              id="c-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              defaultValue={defaultEmail}
              className="tester-form__field"
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="contact-form__group">
        <legend>
          <span className="contact-form__step" aria-hidden="true">
            2
          </span>
          Twoja sprawa
        </legend>
        <div>
          <label htmlFor="c-message">
            Wiadomość <span>(wymagane)</span>
          </label>
          <p id="c-message-hint" className="contact-form__note">
            Napisz własnymi słowami. Nie musisz znać urzędowych nazw.
          </p>
          <textarea
            id="c-message"
            name="message"
            required
            rows={8}
            defaultValue={defaultMessage}
            aria-describedby="c-message-hint"
            className="tester-form__field"
          />
        </div>
        <div>
          <label htmlFor="c-page">
            Strona, której dotyczy pytanie <span>(opcjonalne)</span>
          </label>
          <input
            id="c-page"
            name="page"
            defaultValue={defaultPage}
            className="tester-form__field"
          />
        </div>
      </fieldset>

      <div className="contact-form__actions">
        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className="tester-form__submit"
        >
          {pending ? "Wysyłam wiadomość…" : "Wyślij wiadomość"}
        </button>
        <p
          role="status"
          aria-live="polite"
          className={state?.ok ? "contact-form__success" : "contact-form__note"}
        >
          {pending
            ? "Wysyłam wiadomość…"
            : state?.ok
              ? state.message
              : "Odpowiadamy w ciągu 2 dni roboczych."}
        </p>
      </div>
    </form>
  );
}
