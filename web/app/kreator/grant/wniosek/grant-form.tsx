"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { grantDraft } from "@/lib/api";
import type { CallView } from "@/lib/calls";
import { submitGrant } from "../../actions";

type BudgetRow = { item: string; category: string; amount: number };

function deadlineLabel(iso: string) {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("pl-PL", { dateStyle: "long" }).format(date);
}

// The call is picked on the server (page.tsx) from the calls table.
export function GrantForm({ call: openCall }: { call: CallView | null }) {
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");
  const [targetGroup, setTargetGroup] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
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
  const [aiFailed, setAiFailed] = useState(false);
  const router = useRouter();

  const total = useMemo(
    () => budget.reduce((sum, row) => sum + (Number(row.amount) || 0), 0),
    [budget],
  );
  const overBudget = openCall?.budget_max != null ? total > openCall.budget_max : false;

  if (!openCall) {
    return (
      <div className="flat-form">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Granty</p>
            <h1>Nabór jest obecnie zamknięty</h1>
            <p>Gdy ruszy kolejny, pojawi się na liście naborów.</p>
          </div>
        </div>
        <p className="empty-result">
          <Link href="/kreator/grant">Zobacz listę naborów</Link>
        </p>
      </div>
    );
  }

  const activeCall = openCall;

  async function generate() {
    setDrafting(true);
    setError("");
    setAiFailed(false);
    try {
      const draft = await grantDraft({
        fiszka: {
          title: `Wniosek: ${activeCall.name}`,
          problem,
          solution,
          target_group: targetGroup.trim(),
          stage: "pomysł",
        },
        call: {
          name: activeCall.name,
          // /ai requires a number; 0 means the call sets no cap.
          budget_max: activeCall.budget_max ?? 0,
          description: activeCall.description ?? "",
        },
      });
      setCel(draft.sections.cel);
      setGrupa(draft.sections.grupa_docelowa);
      setDzialania(draft.sections.dzialania);
      setRezultaty(draft.sections.rezultaty);
      setBudget(draft.budget);
    } catch {
      // No canned text: the applicant fills the sections in from their own answers.
      setAiFailed(true);
      setGrupa(targetGroup.trim());
      setDzialania(solution.trim());
    } finally {
      setDrafting(false);
      setDrafted(true);
    }
  }

  async function submit() {
    if (!authorName.trim()) {
      setError("Wpisz imię i nazwisko albo nazwę organizacji.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorEmail.trim())) {
      setError("Wpisz poprawny adres e-mail. Wyślemy na niego szczegóły wniosku.");
      return;
    }
    if (!accepted) {
      setError("Zaznacz, że zapoznałeś się z regulaminem. To pole jest wymagane.");
      return;
    }
    const title = `Wniosek: ${activeCall.name}`;
    setSending(true);
    const result = await submitGrant({
      title,
      callName: activeCall.name,
      authorName,
      authorEmail,
      problem,
      solution,
      targetGroup,
      sections: { cel, grupa_docelowa: grupa, dzialania, rezultaty },
      budget,
    });
    setSending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    try {
      // Read by /kreator/potwierdzenie to say where the details were emailed.
      sessionStorage.setItem(
        "hubmi-last-submission",
        JSON.stringify({ type: "grant_application", title, email: authorEmail.trim(), emailSent: result.emailSent ?? false }),
      );
    } catch {
      /* ignore */
    }
    setDone(true);
    router.push("/kreator/potwierdzenie");
  }

  if (done) {
    return (
      <div className="flat-form">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Granty</p>
            <h1>Gotowe. Zgłoszenie zostało zapisane.</h1>
          </div>
        </div>
        <p role="status" className="empty-result">
          Otwieram potwierdzenie…
        </p>
      </div>
    );
  }

  function setBudgetRow(index: number, patch: Partial<BudgetRow>) {
    setBudget((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  }

  return (
    <div className="flat-form">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Wniosek o grant</p>
          <h1>{activeCall.name}</h1>
          <p>
            Opisz pomysł własnymi słowami. Resztę wniosku przygotujemy jako
            szkic, który możesz poprawić.
          </p>
        </div>
      </div>

      {activeCall.deadline || activeCall.budget_max != null ? (
        <dl className="call-card__facts">
          {activeCall.deadline ? (
            <div>
              <dt>Wnioski można składać do</dt>
              <dd>{deadlineLabel(activeCall.deadline)}</dd>
            </div>
          ) : null}
          {activeCall.budget_max != null ? (
            <div>
              <dt>Maksymalna kwota</dt>
              <dd>{activeCall.budget_max.toLocaleString("pl-PL")} zł</dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      <form
        className="grant-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!drafted) void generate();
          else void submit();
        }}
      >
        <section className="grant-step" aria-labelledby="krok-1">
          <p className="eyebrow">Krok 1</p>
          <h2 id="krok-1">Opisz swój pomysł</h2>

          <div className="tester-form">
            <div>
              <label htmlFor="problem">
                Jaki problem rozwiązujesz? <span>(wymagane)</span>
              </label>
              <textarea
                id="problem"
                required
                rows={4}
                className="tester-form__field"
                placeholder="Np. Sąsiedzi seniorzy są sami i nie dojadą do przychodni."
                value={problem}
                onChange={(event) => setProblem(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="solution">
                Na czym polega pomysł? <span>(wymagane)</span>
              </label>
              <textarea
                id="solution"
                required
                rows={4}
                className="tester-form__field"
                placeholder="Np. Sąsiedzki bus dwa razy w tygodniu i dyżur wolontariuszy przy zapisach do lekarza."
                value={solution}
                onChange={(event) => setSolution(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="target-group">Dla kogo jest pomysł?</label>
              <input
                id="target-group"
                type="text"
                className="tester-form__field"
                placeholder="Np. seniorzy w gminie wiejskiej"
                value={targetGroup}
                onChange={(event) => setTargetGroup(event.target.value)}
              />
            </div>
          </div>

          {!drafted ? (
            <button
              type="submit"
              disabled={drafting}
              aria-busy={drafting}
              className="tester-form__submit"
            >
              {drafting ? "Przygotowuję szkic…" : "Wygeneruj szkic wniosku"}
            </button>
          ) : null}
        </section>

        {drafted ? (
          <>
            <section className="grant-step" aria-labelledby="krok-2">
              <p className="eyebrow">Krok 2</p>
              <h2 id="krok-2">Sprawdź i popraw szkic</h2>

              {aiFailed ? (
                <p role="alert" className="form-error">
                  Asystent AI jest teraz niedostępny. Uzupełnij sekcje poniżej
                  samodzielnie albo{" "}
                  <button
                    type="button"
                    className="grant-retry"
                    onClick={() => void generate()}
                  >
                    spróbuj ponownie
                  </button>
                  .
                </p>
              ) : (
                <p role="status" className="grant-note">
                  Przygotowaliśmy pierwszy szkic. Sprawdź każdą odpowiedź — to
                  Ty odpowiadasz za treść wniosku.
                </p>
              )}

              <div className="tester-form">
                <div className="tester-form__grid">
                  <div>
                    <label htmlFor="cel">Cel</label>
                    <textarea
                      id="cel"
                      rows={4}
                      className="tester-form__field"
                      value={cel}
                      onChange={(e) => setCel(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="grupa">Grupa docelowa</label>
                    <textarea
                      id="grupa"
                      rows={4}
                      className="tester-form__field"
                      value={grupa}
                      onChange={(e) => setGrupa(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="dzialania">Działania</label>
                    <textarea
                      id="dzialania"
                      rows={4}
                      className="tester-form__field"
                      value={dzialania}
                      onChange={(e) => setDzialania(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="rezultaty">Rezultaty</label>
                    <textarea
                      id="rezultaty"
                      rows={4}
                      className="tester-form__field"
                      value={rezultaty}
                      onChange={(e) => setRezultaty(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="grant-step" aria-labelledby="krok-3">
              <p className="eyebrow">Krok 3</p>
              <h2 id="krok-3">Budżet</h2>

              <div className="grant-budget-wrap">
                <table className="grant-budget">
                  <caption>
                    Każdą pozycję możesz zmienić. Suma liczy się na bieżąco.
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Pozycja</th>
                      <th scope="col">Kategoria</th>
                      <th scope="col" className="grant-budget__num">
                        Kwota (zł)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {budget.map((row, index) => (
                      <tr key={index}>
                        <td>
                          <input
                            className="tester-form__field"
                            aria-label={`Pozycja ${index + 1}`}
                            value={row.item}
                            onChange={(e) => setBudgetRow(index, { item: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            className="tester-form__field"
                            aria-label={`Kategoria ${index + 1}`}
                            value={row.category}
                            onChange={(e) => setBudgetRow(index, { category: e.target.value })}
                          />
                        </td>
                        <td className="grant-budget__num">
                          <input
                            type="number"
                            className="tester-form__field"
                            aria-label={`Kwota ${index + 1}`}
                            value={row.amount}
                            onChange={(e) =>
                              setBudgetRow(index, { amount: Number(e.target.value) })
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p
                className={overBudget ? "form-error" : "grant-total"}
                role={overBudget ? "alert" : undefined}
                aria-live="polite"
              >
                Suma: {total.toLocaleString("pl-PL")} zł.
                {overBudget ? " To przekracza maksymalną kwotę naboru." : ""}
              </p>
            </section>

            <section className="grant-step" aria-labelledby="krok-4">
              <p className="eyebrow">Krok 4</p>
              <h2 id="krok-4">Dane do kontaktu</h2>

              <div className="tester-form">
                <div className="tester-form__grid">
                  <div>
                    <label htmlFor="author-name">
                      Imię i nazwisko albo nazwa organizacji{" "}
                      <span>(wymagane)</span>
                    </label>
                    <input
                      id="author-name"
                      required
                      autoComplete="name"
                      className="tester-form__field"
                      value={authorName}
                      onChange={(event) => setAuthorName(event.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="author-email">
                      E-mail <span>(wymagane)</span>
                    </label>
                    <p id="author-email-hint" className="flat-form__hint">
                      Wyślemy na ten adres szczegóły wniosku. Pracownicy ROPS
                      odpowiedzą także tutaj.
                    </p>
                    <input
                      id="author-email"
                      type="email"
                      required
                      autoComplete="email"
                      aria-describedby="author-email-hint"
                      className="tester-form__field"
                      value={authorEmail}
                      onChange={(event) => setAuthorEmail(event.target.value)}
                    />
                  </div>
                </div>

                <label
                  className={accepted ? "grant-consent is-selected" : "grant-consent"}
                  htmlFor="regulamin"
                >
                  <input
                    id="regulamin"
                    type="checkbox"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                  />
                  <span>
                    Zapoznałem się z{" "}
                    {activeCall.regulamin_url ? (
                      <a href={activeCall.regulamin_url}>regulaminem</a>
                    ) : (
                      "regulaminem"
                    )}
                    . <span className="grant-consent__req">(wymagane)</span>
                  </span>
                </label>

                {error ? (
                  <p id="submit-error" role="alert" className="form-error">
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={sending}
                  aria-busy={sending}
                  className="tester-form__submit"
                >
                  {sending ? "Wysyłam…" : "Wyślij zgłoszenie"}
                </button>
              </div>
            </section>
          </>
        ) : null}
      </form>
    </div>
  );
}
