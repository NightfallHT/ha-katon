"use client";

import { useActionState } from "react";
import { createRow, saveRow, type SaveResult } from "./actions";
import type { TableDef } from "./_tables";

const field =
  "mt-2 w-full rounded-xl border-2 border-input bg-card p-3 font-mono text-base";

function display(value: unknown, kind: string) {
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

  return (
    <form action={action} className="tester-form">
      {state ? (
        <p
          role={state.ok ? "status" : "alert"}
          aria-live="polite"
          className={`rounded-xl border-2 bg-card p-3 font-bold ${
            state.ok ? "border-border" : "border-destructive"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      {table.fields.map((item) => {
        const id = `f-${item.name}`;
        const value = display(row[item.name], item.kind);

        if (item.kind === "readonly") {
          return mode === "create" ? null : (
            <div key={item.name}>
              <span >{item.label}</span>
              <p className="dane-readonly">{value || "—"}</p>
            </div>
          );
        }

        if (item.kind === "boolean") {
          return (
            <div key={item.name}>
              <label className="dane-check">
                <input
                  type="checkbox"
                  name={item.name}
                  defaultChecked={value === "true"}
                  
                />
                {item.label}
              </label>
            </div>
          );
        }

        return (
          <div key={item.name}>
            <label htmlFor={id} >
              {item.label}
            </label>
            {item.kind === "textarea" || item.kind === "json" ? (
              <textarea
                id={id}
                name={item.name}
                defaultValue={value}
                rows={item.kind === "json" ? 8 : 4}
                className={field}
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
                defaultValue={value}
                className={field}
              />
            )}
          </div>
        );
      })}

      <button
        type="submit"
        disabled={pending}
        className="tester-form__submit"
      >
        {pending
          ? "Zapisuję…"
          : mode === "create"
            ? "Dodaj wiersz"
            : "Zapisz zmiany"}
      </button>
    </form>
  );
}
