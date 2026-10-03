"use client";

import { useActionState } from "react";
import { signUpToTest, submitReview, type TesterResult } from "./tester-panel-actions";

const btn = "min-h-11 rounded-md border px-4 py-2 font-medium focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60";
const field = "mt-1 w-full rounded-md border p-3";

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
    <form action={action} className="space-y-3">
      <div>
        <label htmlFor="t-email" className="block font-medium">Twój e-mail <span className="font-normal">(wymagane)</span></label>
        <input id="t-email" name="email" type="email" required defaultValue={defaultEmail} autoComplete="email" className={field} />
      </div>
      <div>
        <label htmlFor="t-motivation" className="block font-medium">Dlaczego chcesz to przetestować? <span className="font-normal">(wymagane)</span></label>
        <textarea id="t-motivation" name="motivation" required rows={3} className={field} />
      </div>
      <button type="submit" disabled={pending} className={btn}>Chcę przetestować</button>
      <Status state={state} pending={pending} pendingText="Wysyłam zgłoszenie…" />
    </form>
  );
}

export function ReviewForm({ innovationId, innovationTitle, defaultEmail }: { innovationId: string; innovationTitle: string; defaultEmail: string }) {
  const [state, action, pending] = useActionState(submitReview.bind(null, innovationId, innovationTitle), null);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="email" value={defaultEmail} />
      <fieldset>
        <legend className="font-medium">Twoja ocena <span className="font-normal">(wymagane)</span></legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n}>
              <input id={`rating-${n}`} type="radio" name="rating" value={n} required className="peer sr-only" />
              <label
                htmlFor={`rating-${n}`}
                className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-1 rounded-md border px-3 py-2 text-lg peer-checked:bg-foreground peer-checked:text-background peer-focus-visible:ring-2 peer-focus-visible:ring-ring"
              >
                <span aria-hidden="true">{n} ★</span>
                <span className="sr-only">{n} {n === 1 ? "gwiazdka" : n < 5 ? "gwiazdki" : "gwiazdek"}</span>
              </label>
            </div>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="r-feedback" className="block font-medium">Jak oceniasz to rozwiązanie?</label>
        <textarea id="r-feedback" name="feedback" rows={3} className={field} />
      </div>
      <div>
        <label htmlFor="r-improvement" className="block font-medium">Co można poprawić?</label>
        <textarea id="r-improvement" name="improvement" rows={3} className={field} />
      </div>
      <button type="submit" disabled={pending} className={btn}>Wyślij ocenę</button>
      <Status state={state} pending={pending} pendingText="Zapisuję ocenę…" />
    </form>
  );
}
