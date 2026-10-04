"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { KreatorAssist } from "./kreator-assist";
import { submitFiszka } from "./actions";

export type FiszkaKind = "idea" | "good_practice";

const STAGE_OPTIONS = [
  { value: "pomysł", label: "Mam dopiero pomysł" },
  { value: "testowana", label: "Chcę go przetestować albo już testuję" },
  { value: "wdrożona", label: "Rozwiązanie już działa" },
];

type Field = {
  key: "title" | "problem" | "solution" | "target_group" | "location";
  label: string;
  hint: string;
  kind: "input" | "textarea";
};

// Order is the two-column reading order: what and for whom, then problem and
// solution side by side, then where. Full-width fields were uncomfortably long
// lines on a desktop screen.
const FIELDS: Field[] = [
  {
    key: "title",
    label: "Nazwij swój pomysł",
    hint: "Krótka nazwa, na przykład „Sąsiedzki transport do lekarza”.",
    kind: "input",
  },
  {
    key: "target_group",
    label: "Dla kogo to jest?",
    hint: "Napisz, kto najbardziej potrzebuje pomocy.",
    kind: "input",
  },
  {
    key: "problem",
    label: "Jaki problem chcesz rozwiązać?",
    hint: "Opisz, co utrudnia ludziom codzienne życie.",
    kind: "textarea",
  },
  {
    key: "solution",
    label: "Na czym polega Twój pomysł?",
    hint: "Opisz najprostszy sposób działania.",
    kind: "textarea",
  },
  {
    key: "location",
    label: "Gdzie chcesz działać?",
    hint: "Podaj gminę, powiat albo wpisz „cała Małopolska”.",
    kind: "input",
  },
];

/**
 * One screen, every question visible. Replaces the earlier four-step wizard:
 * users lost context between steps, and a flat form shows how much work is left
 * and lets them answer in any order.
 */
export function FiszkaForm({ kind }: { kind: FiszkaKind }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [values, setValues] = useState({
    title: "",
    problem: searchParams.get("problem") ?? "",
    solution: "",
    target_group: "",
    stage: "pomysł",
    location: "",
  });
  const [errors, setErrors] = useState<Field["key"][]>([]);
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState("");
  const summaryRef = useRef<HTMLDivElement>(null);

  const heading = kind === "idea" ? "Zgłoś pomysł" : "Podziel się dobrą praktyką";

  function set(key: keyof typeof values, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors.includes(key as Field["key"])) {
      setErrors((prev) => prev.filter((item) => item !== key));
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const missing = FIELDS.filter((field) => !values[field.key].trim()).map((field) => field.key);
    setErrors(missing);
    setFailure("");
    if (missing.length) {
      // Error summary first, with links into the fields (WCAG 3.3.1).
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    setSending(true);
    const result = await submitFiszka({
      type: kind,
      title: values.title,
      problem: values.problem,
      solution: values.solution,
      target_group: values.target_group,
      stage: values.stage,
      location: values.location,
    });
    setSending(false);
    if (!result.ok) {
      setFailure(result.message);
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    // The confirmation page reads this to name the submission back to the user.
    try {
      sessionStorage.setItem(
        "hubmi-last-submission",
        JSON.stringify({ title: values.title, type: kind }),
      );
    } catch {
      /* confirmation still works without the title */
    }
    router.push(`/kreator/potwierdzenie?message=${encodeURIComponent(result.message)}`);
  }

  const filled = FIELDS.filter((field) => values[field.key].trim()).length;

  return (
    <div className="flat-form">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Kreator pomysłów</p>
          <h1>{heading}</h1>
          <p>
            Wszystkie pytania są na jednej stronie. Wypełnij je w dowolnej
            kolejności — nic nie zatwierdzasz po każdym kroku.
          </p>
        </div>
        <p className="flat-form__progress" aria-live="polite">
          Wypełniono {filled} z {FIELDS.length} pól
        </p>
      </div>

      <div className="flat-form__layout">
        <form onSubmit={onSubmit} noValidate className="tester-form">
          <div
            ref={summaryRef}
            tabIndex={-1}
            role={errors.length || failure ? "alert" : undefined}
            className="flat-form__summary"
          >
            {errors.length ? (
              <div className="flat-form__errors">
                <p>
                  Uzupełnij {errors.length} {errors.length === 1 ? "pole" : "pola"}, żeby wysłać
                  zgłoszenie:
                </p>
                <ul>
                  {errors.map((key) => {
                    const field = FIELDS.find((item) => item.key === key)!;
                    return (
                      <li key={key}>
                        <a href={`#${key}`}>{field.label}</a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
            {failure ? <p className="flat-form__errors">{failure}</p> : null}
          </div>

          <div className="tester-form__grid">
            {FIELDS.map((field) => {
              const invalid = errors.includes(field.key);
              const shared = {
                id: field.key,
                name: field.key,
                value: values[field.key],
                "aria-describedby": `${field.key}-hint`,
                "aria-invalid": invalid ? true : undefined,
                className: invalid ? "tester-form__field is-invalid" : "tester-form__field",
              };
              return (
                <div key={field.key}>
                  <label htmlFor={field.key}>
                    {field.label} <span>(wymagane)</span>
                  </label>
                  <p id={`${field.key}-hint`} className="flat-form__hint">
                    {field.hint}
                  </p>
                  {field.kind === "textarea" ? (
                    <textarea
                      {...shared}
                      rows={4}
                      onChange={(event) => set(field.key, event.target.value)}
                    />
                  ) : (
                    <input
                      {...shared}
                      type="text"
                      onChange={(event) => set(field.key, event.target.value)}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <fieldset className="flat-form__stage">
            <legend>Na jakim etapie to jest?</legend>
            {STAGE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={values.stage === option.value ? "is-selected" : undefined}
              >
                <input
                  type="radio"
                  name="stage"
                  value={option.value}
                  checked={values.stage === option.value}
                  onChange={() => set("stage", option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </fieldset>

          <button type="submit" disabled={sending} className="tester-form__submit">
            {sending ? "Wysyłam…" : "Wyślij do ROPS"}
          </button>
        </form>

        <aside aria-labelledby="assist-h" className="flat-form__aside">
          <h2 id="assist-h">Pomocnik AI</h2>
          <p>Nie wiesz, co napisać? Zapytaj — podpowiedzi wstawisz do formularza.</p>
          <KreatorAssist
            fiszka={{
              title: values.title,
              problem: values.problem,
              solution: values.solution,
              target_group: values.target_group,
              stage: values.stage,
            }}
            onApply={(patch) => setValues((prev) => ({ ...prev, ...patch }))}
          />
        </aside>
      </div>
    </div>
  );
}
