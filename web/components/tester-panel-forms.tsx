"use client";

import { useActionState } from "react";
import { signUpToTest, submitReview, type TesterResult } from "./tester-panel-actions";

const btn = "tester-form__submit";
const field = "tester-form__field";

function Status({ state, pending, pendingText }: { state: TesterResult | null; pending: boolean; pendingText: string }) {
  return (
    <p role="status" aria-live="polite" className="mt-2">
      {pending ? pendingText : state?.message}
    </p>
  );
}

export function SignUpForm({ innovationId, innovationTitle, defaultEmail }: { innovationId: string; innovationTitle: string; defaultEmail: string }) {
  const [state, action, pending] = useActionState(signUpToTest.bind(null, innovationId, innovationTitle), null);
  return (
    <form action={action} className="tester-form">
      <div className="tester-form__grid">
        <div>
          <label htmlFor="t-first-name">Imię <span>(wymagane)</span></label>
          <input id="t-first-name" name="first_name" required autoComplete="given-name" className={field} />
        </div>
        <div>
          <label htmlFor="t-last-name">Nazwisko <span>(wymagane)</span></label>
          <input id="t-last-name" name="last_name" required autoComplete="family-name" className={field} />
        </div>
        <div className="tester-form__wide">
          <label htmlFor="t-email">E-mail <span>(wymagane)</span></label>
          <input id="t-email" name="email" type="email" required defaultValue={defaultEmail} autoComplete="email" className={field} />
        </div>
      </div>
      <button type="submit" disabled={pending} className={btn}>Wyślij zapis</button>
      <Status state={state} pending={pending} pendingText="Wysyłam zgłoszenie…" />
    </form>
  );
}

export function ReviewForm({ innovationId, innovationTitle, defaultEmail }: { innovationId: string; innovationTitle: string; defaultEmail: string }) {
  const [state, action, pending] = useActionState(submitReview.bind(null, innovationId, innovationTitle), null);
  return (
    <form action={action} className="tester-form">
      <div>
        <label htmlFor="r-occasion">
          Przy jakiej okazji testowałeś tę inicjatywę? <span>(wymagane)</span>
        </label>
        <textarea id="r-occasion" name="occasion" rows={5} required className={field} />
      </div>
      <div className="tester-form__grid">
        <div>
          <label htmlFor="r-first-name">Imię <span>(wymagane)</span></label>
          <input id="r-first-name" name="first_name" required autoComplete="given-name" className={field} />
        </div>
        <div>
          <label htmlFor="r-last-name">Nazwisko <span>(wymagane)</span></label>
          <input id="r-last-name" name="last_name" required autoComplete="family-name" className={field} />
        </div>
        <div>
          <label htmlFor="r-email">E-mail <span>(wymagane)</span></label>
          <input id="r-email" name="email" type="email" required defaultValue={defaultEmail} autoComplete="email" className={field} />
        </div>
        <div>
          <label htmlFor="r-rating">Ocena w skali 1–5 <span>(wymagane)</span></label>
          <select id="r-rating" name="rating" required defaultValue="" className={field}>
            <option value="" disabled>Wybierz ocenę</option>
            {[1, 2, 3, 4, 5].map((rating) => (
              <option key={rating} value={rating}>{rating} / 5</option>
            ))}
          </select>
        </div>
        <div className="tester-form__wide">
          <label htmlFor="r-feedback">Ocena <span>(wymagane)</span></label>
          <textarea id="r-feedback" name="feedback" rows={5} required className={field} />
        </div>
      </div>
      <button type="submit" disabled={pending} className={btn}>Wyślij ocenę</button>
      <Status state={state} pending={pending} pendingText="Zapisuję ocenę…" />
    </form>
  );
}
