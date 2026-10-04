"use client";

export type Missing = string[];

/**
 * One save control for the whole panel. The button turns on only when every
 * required field is filled *and* something actually differs from what is
 * stored, and the line next to it says which of the two is missing — a greyed
 * button with no explanation is the thing people get stuck on.
 *
 * The hint sits before the button in the DOM so it is read on the way to it:
 * a disabled button cannot be focused, so `aria-describedby` would never fire.
 */
export function SaveButton({
  label,
  pendingLabel,
  pending,
  dirty,
  missing,
  result,
  idleHint = "Brak zmian do zapisania.",
}: {
  label: string;
  pendingLabel: string;
  pending: boolean;
  dirty: boolean;
  missing: Missing;
  result?: { ok: boolean; message: string } | null;
  idleHint?: string;
}) {
  const blocked = pending || !dirty || missing.length > 0;

  let hint = idleHint;
  let strong = false;
  if (pending) {
    hint = pendingLabel;
  } else if (missing.length > 0) {
    hint = `Uzupełnij, żeby zapisać: ${missing.join(", ")}.`;
    strong = true;
  } else if (dirty) {
    hint = "Masz niezapisane zmiany.";
    strong = true;
  }

  return (
    <div className="admin-save">
      <p
        className={strong ? "admin-save__hint admin-save__hint--dirty" : "admin-save__hint"}
        aria-live="polite"
      >
        {hint}
      </p>
      <button type="submit" disabled={blocked} className="admin-primary-action">
        {pending ? pendingLabel : label}
      </button>
      {result && !pending ? (
        <p
          role={result.ok ? "status" : "alert"}
          className={
            result.ok ? "admin-save__result" : "admin-save__result admin-save__result--bad"
          }
        >
          {result.message}
        </p>
      ) : null}
    </div>
  );
}
