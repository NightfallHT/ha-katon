"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ResourceNav } from "@/components/resource-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { calls } from "@/content/catalog";
import { grantDraft } from "@/lib/api";
import { submitGrant } from "../actions";

type BudgetRow = { item: string; category: string; amount: number };

export default function GrantPage() {
  const openCall = calls.find((item) => item.is_open);
  const [problem, setProblem] = useState(
    "Sąsiedzi seniorzy są sami i nie dojadą do przychodni.",
  );
  const [solution, setSolution] = useState("");
  const [drafted, setDrafted] = useState(false);
  const [cel, setCel] = useState("");
  const [grupa, setGrupa] = useState("");
  const [dzialania, setDzialania] = useState("");
  const [rezultaty, setRezultaty] = useState("");
  const [budget, setBudget] = useState<BudgetRow[]>([
    { item: "Koordynacja", category: "personel", amount: 20000 },
    { item: "Dojazdy", category: "transport", amount: 15000 },
  ]);
  const [accepted, setAccepted] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [drafting, setDrafting] = useState(false);

  const total = useMemo(
    () => budget.reduce((sum, row) => sum + (Number(row.amount) || 0), 0),
    [budget],
  );
  const overBudget = openCall ? total > openCall.budget_max : false;

  if (!openCall) {
    return (
      <div>
        <ResourceNav current="/kreator" />
        <h1 className="text-3xl font-bold">Nabór jest obecnie zamknięty</h1>
        <p className="mt-3">
          <Link href="/kreator" className="underline underline-offset-4">
            Wróć do Kreatora
          </Link>
        </p>
      </div>
    );
  }

  const activeCall = openCall;

  async function generate() {
    setDrafting(true);
    setError("");
    try {
      const draft = await grantDraft({
        fiszka: {
          title: `Wniosek: ${activeCall.name}`,
          problem,
          solution,
          target_group: "seniorzy w gminie wiejskiej",
          stage: "pomysł",
        },
        call: {
          name: activeCall.name,
          budget_max: activeCall.budget_max,
          description: activeCall.description,
        },
      });
      setCel(draft.sections.cel);
      setGrupa(draft.sections.grupa_docelowa);
      setDzialania(draft.sections.dzialania);
      setRezultaty(draft.sections.rezultaty);
      setBudget(draft.budget);
    } catch {
      setCel(
        "Zmniejszyć samotność i ułatwić dojazd do lekarza osobom starszym w gminie wiejskiej.",
      );
      setGrupa("Seniorzy i ich sąsiedzi w gminie wiejskiej.");
      setDzialania(
        solution.trim() ||
          "Sąsiedzki bus dwa razy w tygodniu i dyżur wolontariuszy przy zapisach do przychodni.",
      );
      setRezultaty("Co najmniej 20 osób skorzysta z kursu w pierwszym kwartale.");
    } finally {
      setDrafting(false);
      setDrafted(true);
    }
  }

  async function submit() {
    if (!accepted) {
      setError("Zaznacz, że zapoznałeś się z regulaminem. To pole jest wymagane.");
      return;
    }
    const title = `Wniosek: ${activeCall.name}`;
    try {
      sessionStorage.setItem(
        "hubmi-last-submission",
        JSON.stringify({
          type: "grant_application",
          title,
          payload: {
            sections: { cel, grupa_docelowa: grupa, dzialania, rezultaty },
            budget,
            accepted_regulamin: true,
          },
        }),
      );
    } catch {
      /* ignore */
    }
    setSending(true);
    const result = await submitGrant({
      title,
      callName: activeCall.name,
      problem,
      solution,
      sections: { cel, grupa_docelowa: grupa, dzialania, rezultaty },
      budget,
    });
    setSending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div>
        <ResourceNav current="/kreator" />
        <h1 className="text-3xl font-bold">Gotowe. Wniosek został wysłany.</h1>
        <p className="mt-3">Możesz śledzić jego status w „Moich zgłoszeniach”.</p>
        <p className="mt-6">
          <Link href="/moje-zgloszenia" className="underline underline-offset-4">
            Moje zgłoszenia
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <ResourceNav current="/kreator" />
      <h1 className="text-3xl font-bold">Przygotuj wniosek o grant</h1>
      <p className="mt-2">
        {openCall.name}. Termin zgłoszeń: {openCall.deadline}. Maksymalna kwota:{" "}
        {openCall.budget_max.toLocaleString("pl-PL")} zł.
      </p>

      <form
        className="mt-6 max-w-2xl space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!drafted) void generate();
          else void submit();
        }}
      >
        <div>
          <Label htmlFor="problem">Jaki problem rozwiązujesz? (wymagane)</Label>
          <Textarea
            id="problem"
            required
            value={problem}
            onChange={(event) => setProblem(event.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="solution">Na czym polega pomysł? (wymagane)</Label>
          <Textarea
            id="solution"
            required
            value={solution}
            onChange={(event) => setSolution(event.target.value)}
          />
        </div>

        {!drafted ? (
          <Button type="submit" disabled={drafting}>
            {drafting ? "Przygotowuję szkic…" : "Wygeneruj szkic wniosku"}
          </Button>
        ) : (
          <>
            <p role="status">Przygotowaliśmy pierwszy szkic. Sprawdź każdą odpowiedź.</p>
            <div>
              <Label htmlFor="cel">Cel</Label>
              <Textarea id="cel" value={cel} onChange={(e) => setCel(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="grupa">Grupa docelowa</Label>
              <Textarea id="grupa" value={grupa} onChange={(e) => setGrupa(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="dzialania">Działania</Label>
              <Textarea
                id="dzialania"
                value={dzialania}
                onChange={(e) => setDzialania(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="rezultaty">Rezultaty</Label>
              <Textarea
                id="rezultaty"
                value={rezultaty}
                onChange={(e) => setRezultaty(e.target.value)}
              />
            </div>

            <table className="w-full border-collapse text-left">
              <caption className="mb-2 text-left">Budżet szkicu</caption>
              <thead>
                <tr className="border-b">
                  <th scope="col" className="py-2">
                    Pozycja
                  </th>
                  <th scope="col" className="py-2">
                    Kategoria
                  </th>
                  <th scope="col" className="py-2">
                    Kwota
                  </th>
                </tr>
              </thead>
              <tbody>
                {budget.map((row, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2 pr-2">
                      <Input
                        aria-label={`Pozycja ${index + 1}`}
                        value={row.item}
                        onChange={(e) => {
                          const next = [...budget];
                          next[index] = { ...row, item: e.target.value };
                          setBudget(next);
                        }}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <Input
                        aria-label={`Kategoria ${index + 1}`}
                        value={row.category}
                        onChange={(e) => {
                          const next = [...budget];
                          next[index] = { ...row, category: e.target.value };
                          setBudget(next);
                        }}
                      />
                    </td>
                    <td className="py-2">
                      <Input
                        type="number"
                        aria-label={`Kwota ${index + 1}`}
                        value={row.amount}
                        onChange={(e) => {
                          const next = [...budget];
                          next[index] = { ...row, amount: Number(e.target.value) };
                          setBudget(next);
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p>
              Suma: {total.toLocaleString("pl-PL")} zł.
              {overBudget ? (
                <span> To przekracza maksymalną kwotę naboru.</span>
              ) : null}
            </p>
            <p>To jest szkic. Sprawdź go z regulaminem naboru.</p>
            <label className="flex min-h-11 items-start gap-2">
              <input
                type="checkbox"
                className="mt-1 size-5"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />
              <span>
                Zapoznałem się z{" "}
                <a className="underline" href={openCall.regulamin_url}>
                  regulaminem
                </a>
                . (wymagane)
              </span>
            </label>
            {error ? (
              <p id="regulamin-error" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" disabled={sending}>
              {sending ? "Wysyłam…" : "Wyślij zgłoszenie"}
            </Button>
          </>
        )}
      </form>
    </div>
  );
}
