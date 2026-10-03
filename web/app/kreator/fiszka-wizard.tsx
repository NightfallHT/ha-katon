"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ResourceNav } from "@/components/resource-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type FiszkaKind = "idea" | "good_practice";

const STEPS = [
  {
    key: "problem" as const,
    title: "Jaki problem chcesz rozwiązać?",
    hint: "Opisz, co utrudnia ludziom codzienne życie.",
    field: "textarea" as const,
  },
  {
    key: "solution" as const,
    title: "Jak chcesz pomóc?",
    hint: "Opisz najprostszy sposób działania.",
    field: "textarea" as const,
  },
  {
    key: "target_group" as const,
    title: "Kogo dotyczy ten problem?",
    hint: "Napisz, kto najbardziej potrzebuje pomocy.",
    field: "input" as const,
  },
  {
    key: "stage" as const,
    title: "Na jakim etapie jest pomysł i gdzie chcesz działać?",
    hint: "Wybierz etap i podaj gminę, powiat albo całą Małopolskę.",
    field: "stage" as const,
  },
];

const STAGE_OPTIONS = [
  { value: "pomysł", label: "Mam dopiero pomysł" },
  { value: "testowana", label: "Chcę go przetestować albo już testuję" },
  { value: "wdrożona", label: "Rozwiązanie już działa" },
];

export function FiszkaWizard({ kind }: { kind: FiszkaKind }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [values, setValues] = useState({
    problem: searchParams.get("problem") ?? "",
    solution: "",
    target_group: "",
    stage: "pomysł",
    location: "",
  });

  const current = STEPS[step];
  const progress = `Krok ${step + 1} z ${STEPS.length}`;

  const missing = useMemo(() => {
    const list: string[] = [];
    if (step === 0 && !values.problem.trim()) list.push("problem");
    if (step === 1 && !values.solution.trim()) list.push("solution");
    if (step === 2 && !values.target_group.trim()) list.push("target_group");
    if (step === 3 && !values.location.trim()) list.push("location");
    if (step === 3 && !title.trim()) list.push("title");
    return list;
  }, [step, values, title]);

  function goNext() {
    if (missing.length) {
      setErrors(["Uzupełnij jeszcze kilka odpowiedzi."]);
      return;
    }
    setErrors([]);
    setStep((n) => n + 1);
  }

  function submit() {
    if (missing.length) {
      setErrors(["Uzupełnij jeszcze kilka odpowiedzi."]);
      return;
    }
    const payload = {
      type: kind,
      title: title.trim(),
      author_email: "anna.k@razem-blizej.demo",
      payload: {
        problem: values.problem.trim(),
        solution: values.solution.trim(),
        target_group: values.target_group.trim(),
        stage: values.stage,
        location: values.location.trim(),
      },
    };
    try {
      sessionStorage.setItem("hubmi-last-submission", JSON.stringify(payload));
    } catch {
      /* ignore */
    }
    router.push("/kreator/potwierdzenie");
  }

  return (
    <div>
      <ResourceNav current="/kreator" />
      <h1 className="text-3xl font-bold">
        {kind === "idea" ? "Zgłoś pomysł" : "Podziel się dobrą praktyką"}
      </h1>
      <p className="mt-2" aria-live="polite">
        {progress}
      </p>

      {errors.length ? (
        <div className="mt-4 rounded-lg border border-destructive p-3" role="alert">
          <p>{errors[0]}</p>
          <p>
            <a className="underline" href={`#${missing[0] ?? "problem"}`}>
              Przejdź do pola
            </a>
          </p>
        </div>
      ) : null}

      <form
        className="mt-6 max-w-xl space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (step < STEPS.length - 1) goNext();
          else submit();
        }}
      >
        <h2 className="text-2xl font-bold">{current.title}</h2>
        <p id={`${current.key}-hint`}>{current.hint}</p>

        {current.field === "textarea" ? (
          <>
            <Label htmlFor={current.key}>{current.title} (wymagane)</Label>
            <Textarea
              id={current.key}
              name={current.key}
              required
              value={values[current.key]}
              aria-describedby={`${current.key}-hint`}
              aria-invalid={errors.length && missing.includes(current.key) ? true : undefined}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, [current.key]: event.target.value }))
              }
            />
          </>
        ) : null}

        {current.field === "input" ? (
          <>
            <Label htmlFor="target_group">Dla kogo (wymagane)</Label>
            <Input
              id="target_group"
              name="target_group"
              required
              value={values.target_group}
              aria-describedby="target_group-hint"
              onChange={(event) =>
                setValues((prev) => ({ ...prev, target_group: event.target.value }))
              }
            />
          </>
        ) : null}

        {current.field === "stage" ? (
          <>
            <Label htmlFor="title">Krótki tytuł (wymagane)</Label>
            <Input
              id="title"
              name="title"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
            <fieldset>
              <legend className="mb-2 font-medium">Etap (wymagane)</legend>
              {STAGE_OPTIONS.map((option) => (
                <label key={option.value} className="flex min-h-11 items-center gap-2">
                  <input
                    type="radio"
                    name="stage"
                    className="size-5"
                    value={option.value}
                    checked={values.stage === option.value}
                    onChange={() =>
                      setValues((prev) => ({ ...prev, stage: option.value }))
                    }
                  />
                  {option.label}
                </label>
              ))}
            </fieldset>
            <Label htmlFor="location">Gdzie chcesz działać? (wymagane)</Label>
            <Input
              id="location"
              name="location"
              required
              value={values.location}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, location: event.target.value }))
              }
            />
          </>
        ) : null}

        <div className="flex flex-wrap gap-3 pt-2">
          {step > 0 ? (
            <Button type="button" variant="outline" onClick={() => setStep((n) => n - 1)}>
              Wstecz
            </Button>
          ) : (
            <Button type="button" variant="outline" asChild>
              <Link href="/kreator">Anuluj</Link>
            </Button>
          )}
          <Button type="submit">
            {step < STEPS.length - 1 ? "Dalej" : "Wyślij zgłoszenie"}
          </Button>
        </div>
      </form>
    </div>
  );
}
