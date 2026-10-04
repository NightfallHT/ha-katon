"use client";

import { useActionState, useState } from "react";
import { CATEGORY_LABELS } from "../../_lib/labels";
import { SaveButton } from "../../_lib/save-button";
import { saveInnovation, type InnovationValues } from "./actions";

type Inn = {
  id: string;
  title: string;
  summary: string;
  description: string | null;
  category: string;
  tags: string[] | null;
  video_url: string | null;
  published: boolean;
};

function toValues(inn: Inn): InnovationValues {
  return {
    title: inn.title,
    summary: inn.summary,
    description: inn.description ?? "",
    category: inn.category,
    tags: (inn.tags ?? []).join(", "),
    video_url: inn.video_url ?? "",
    published: inn.published,
  };
}

export function EditForm({ inn }: { inn: Inn }) {
  const initial = toValues(inn);
  const [state, action, pending] = useActionState(saveInnovation.bind(null, inn.id), null);
  const [values, setValues] = useState(initial);

  // After a successful write the stored row is what we just sent, so compare
  // against that instead of the values the page was rendered with.
  const baseline = state?.saved ?? initial;
  const dirty = (Object.keys(values) as (keyof InnovationValues)[]).some(
    (key) => values[key] !== baseline[key],
  );
  const missing = [
    !values.title.trim() && "Tytuł",
    !values.summary.trim() && "Krótki opis",
  ].filter(Boolean) as string[];

  function set<K extends keyof InnovationValues>(key: K, value: InnovationValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <form action={action} className="admin-card admin-form">
      <div className="admin-card__head">
        <h2>Karta innowacji</h2>
        <p className="admin-card__note">Zmiany widać od razu na stronie Biblioteki.</p>
      </div>

      <div className="admin-form__grid">
        <div className="admin-form__wide">
          <label htmlFor="e-title">
            Tytuł <span className="admin-field__hint">(wymagane)</span>
          </label>
          <input
            id="e-title"
            name="title"
            required
            value={values.title}
            onChange={(event) => set("title", event.target.value)}
            className="admin-input admin-input--wide"
          />
        </div>

        <div className="admin-form__wide">
          <label htmlFor="e-summary">
            Krótki opis, 1 do 2 zdań <span className="admin-field__hint">(wymagane)</span>
          </label>
          <textarea
            id="e-summary"
            name="summary"
            required
            rows={3}
            value={values.summary}
            onChange={(event) => set("summary", event.target.value)}
            className="admin-input admin-input--wide"
          />
        </div>

        <div className="admin-form__wide">
          <label htmlFor="e-desc">Pełny opis</label>
          <textarea
            id="e-desc"
            name="description"
            rows={6}
            value={values.description}
            onChange={(event) => set("description", event.target.value)}
            className="admin-input admin-input--wide"
          />
        </div>

        <div>
          <label htmlFor="e-cat">Kategoria</label>
          <select
            id="e-cat"
            name="category"
            value={values.category}
            onChange={(event) => set("category", event.target.value)}
            className="admin-select"
          >
            {Object.entries(CATEGORY_LABELS).map(([key, text]) => (
              <option key={key} value={key}>
                {text}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="e-tags">Tagi, rozdzielone przecinkami</label>
          <input
            id="e-tags"
            name="tags"
            value={values.tags}
            onChange={(event) => set("tags", event.target.value)}
            className="admin-input admin-input--wide"
          />
        </div>

        <div className="admin-form__wide">
          <label htmlFor="e-video">Adres filmu</label>
          <input
            id="e-video"
            name="video_url"
            type="url"
            value={values.video_url}
            onChange={(event) => set("video_url", event.target.value)}
            className="admin-input admin-input--wide"
          />
        </div>
      </div>

      <label className="admin-check" htmlFor="e-pub">
        <input
          id="e-pub"
          name="published"
          type="checkbox"
          checked={values.published}
          onChange={(event) => set("published", event.target.checked)}
        />
        Opublikowana w Bibliotece
      </label>

      <SaveButton
        label="Zapisz zmiany"
        pendingLabel="Zapisuję i odświeżam dopasowania…"
        pending={pending}
        dirty={dirty}
        missing={missing}
        result={state}
      />
    </form>
  );
}
