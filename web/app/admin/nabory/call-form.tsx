"use client";

import { useActionState, useState } from "react";
import { OpenBadge } from "../_lib/status";
import { SaveButton } from "../_lib/save-button";
import { saveCall, type CallValues } from "./actions";

type Call = {
  id: string;
  name: string;
  description: string | null;
  is_open: boolean;
  deadline: string | null;
  budget_max: number | null;
};

export function CallForm({ call }: { call: Call }) {
  const initial: CallValues = {
    is_open: call.is_open,
    deadline: call.deadline ?? "",
    budget_max: call.budget_max === null ? "" : String(call.budget_max),
  };
  const [state, action, pending] = useActionState(saveCall.bind(null, call.id), null);
  const [values, setValues] = useState(initial);

  const baseline = state?.saved ?? initial;
  const dirty =
    values.is_open !== baseline.is_open ||
    values.deadline !== baseline.deadline ||
    values.budget_max !== baseline.budget_max;
  // The deadline and the amount are what the public call card shows, so an
  // open call without them would publish a blank.
  const missing = [
    values.is_open && !values.deadline && "Termin",
    values.is_open && !values.budget_max && "Budżet maksymalny",
  ].filter(Boolean) as string[];

  const prefix = `call-${call.id}`;

  return (
    <form action={action} className="admin-card admin-form">
      <div className="admin-card__head">
        <h2>{call.name}</h2>
        <OpenBadge open={values.is_open} />
      </div>
      {call.description ? <p className="admin-card__note">{call.description}</p> : null}

      <label className="admin-check" htmlFor={`${prefix}-open`}>
        <input
          id={`${prefix}-open`}
          name="is_open"
          type="checkbox"
          checked={values.is_open}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, is_open: event.target.checked }))
          }
        />
        Nabór otwarty — generator wniosku jest widoczny w Kreatorze
      </label>

      <div className="admin-form__grid">
        <div>
          <label htmlFor={`${prefix}-deadline`}>Termin składania wniosków</label>
          <input
            id={`${prefix}-deadline`}
            name="deadline"
            type="date"
            value={values.deadline}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, deadline: event.target.value }))
            }
            className="admin-input"
          />
        </div>
        <div>
          <label htmlFor={`${prefix}-budget`}>Budżet maksymalny (zł)</label>
          <input
            id={`${prefix}-budget`}
            name="budget_max"
            type="number"
            min={0}
            step={1}
            value={values.budget_max}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, budget_max: event.target.value }))
            }
            className="admin-input"
          />
        </div>
      </div>

      <SaveButton
        label="Zapisz nabór"
        pendingLabel="Zapisuję…"
        pending={pending}
        dirty={dirty}
        missing={missing}
        result={state}
      />
    </form>
  );
}
