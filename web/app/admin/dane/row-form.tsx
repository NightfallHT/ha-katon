"use client";

import { useActionState, useState } from "react";
import { SaveButton } from "../_lib/save-button";
import { createRow, saveRow, type SaveResult } from "./actions";
import type { FieldKind, TableDef } from "./_tables";

function display(value: unknown, kind: FieldKind) {
  if (value === null || value === undefined) return "";
  if (kind === "list") return Array.isArray(value) ? value.join(", ") : String(value);
  if (kind === "json") return JSON.stringify(value, null, 2);
  if (kind === "date") return String(value).slice(0, 10);
  return String(value);
}

export function RowForm({
  table,
  row,
  mode,
}: {
  table: TableDef;
  row: Record<string, unknown>;
  mode: "edit" | "create";
}) {
  const bound =
    mode === "edit"
      ? saveRow.bind(null, table.name, String(row.id))
      : createRow.bind(null, table.name);
  const [state, action, pending] = useActionState<SaveResult | null, FormData>(
    bound,
    null,
  );

  const editable = table.fields.filter((item) => item.kind !== "readonly");
  const initial: Record<string, string> = {};
  for (const item of editable) {
    initial[item.name] =
      item.kind === "boolean"
        ? String(row[item.name] === true)
        : display(row[item.name], item.kind);
  }
  const [values, setValues] = useState(initial);

  // A new row is "changed" from the moment anything is typed; an existing one
  // only once a value differs from what is stored.
  const dirty =
    mode === "create"
      ? editable.some((item) => values[item.name] !== "" && values[item.name] !== "false")
      : editable.some((item) => values[item.name] !== initial[item.name]);

  function set(name: string, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  return (
    <form action={action} className="admin-form">
      {state ? (
        <p
          role={state.ok ? "status" : "alert"}
          className={
            state.ok ? "admin-notice" : "admin-notice admin-notice--alert"
          }
        >
          {state.message}
        </p>
      ) : null}

      {table.fields.map((item) => {
        const id = `f-${item.name}`;

        if (item.kind === "readonly") {
          return mode === "create" ? null : (
            <div key={item.name} className="admin-field">
              <span>{item.label}</span>
              <p className="dane-readonly">{display(row[item.name], item.kind) || "—"}</p>
            </div>
          );
        }

        if (item.kind === "boolean") {
          return (
            <label key={item.name} className="admin-check" htmlFor={id}>
              <input
                id={id}
                type="checkbox"
                name={item.name}
                checked={values[item.name] === "true"}
                onChange={(event) => set(item.name, String(event.target.checked))}
              />
              {item.label}
            </label>
          );
        }

        return (
          <div key={item.name} className="admin-field">
            <label htmlFor={id}>{item.label}</label>
            {/* The format rule belongs here, not in the list header. */}
            {item.hint ? (
              <p id={`${id}-hint`} className="admin-field__hint">
                {item.hint}
              </p>
            ) : null}
            {item.kind === "textarea" || item.kind === "json" ? (
              <textarea
                id={id}
                name={item.name}
                value={values[item.name]}
                aria-describedby={item.hint ? `${id}-hint` : undefined}
                onChange={(event) => set(item.name, event.target.value)}
                rows={item.kind === "json" ? 8 : 4}
                className="dane-field"
              />
            ) : (
              <input
                id={id}
                name={item.name}
                type={
                  item.kind === "number"
                    ? "number"
                    : item.kind === "date"
                      ? "date"
                      : "text"
                }
                step={item.kind === "number" ? "any" : undefined}
                value={values[item.name]}
                aria-describedby={item.hint ? `${id}-hint` : undefined}
                onChange={(event) => set(item.name, event.target.value)}
                className="dane-field"
              />
            )}
          </div>
        );
      })}

      <SaveButton
        label={mode === "create" ? "Dodaj wiersz" : "Zapisz zmiany"}
        pendingLabel="Zapisuję…"
        pending={pending}
        dirty={dirty}
        missing={[]}
        idleHint={
          mode === "create"
            ? "Wypełnij przynajmniej jedno pole, żeby dodać wiersz."
            : "Brak zmian do zapisania."
        }
      />
    </form>
  );
}
