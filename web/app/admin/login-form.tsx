"use client";

import { useActionState } from "react";
import { signIn } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, null);
  const failed = Boolean(state && !state.ok);

  return (
    <form action={action} className="admin-login">
      {failed ? (
        <p id="login-error" role="alert" className="form-error">
          {state?.message}
        </p>
      ) : null}

      <div className="admin-field">
        <label htmlFor="login">Login</label>
        {/* Keyed on the attempt so the typed login survives a wrong password
            instead of being cleared with it. */}
        <input
          key={state?.login ?? ""}
          id="login"
          name="login"
          autoComplete="username"
          required
          defaultValue={state?.login ?? ""}
          aria-describedby={failed ? "login-error" : undefined}
          className="admin-input"
        />
      </div>

      <div className="admin-field">
        <label htmlFor="password">Hasło</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          defaultValue=""
          className="admin-input"
        />
      </div>

      <button type="submit" disabled={pending} className="admin-primary-action">
        {pending ? "Sprawdzam…" : "Zaloguj się"}
      </button>
    </form>
  );
}
