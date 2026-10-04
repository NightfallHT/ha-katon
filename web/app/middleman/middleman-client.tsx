"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LoaderCircle, Search } from "lucide-react";
import { calls, gminas, innovations } from "@/content/catalog";
import { currentRole, writeCookie, type Role } from "@/lib/demo-session";
import { middlemanChat, middlemanReport, simplify } from "@/lib/api";
import type { ChatTurn, MiddlemanReport } from "@/lib/types";

const INSTITUTION_ROLES: Role[] = ["gmina", "ngo"];

const SUGGESTIONS = [
  "Najbardziej dotyczy to osób w mniejszych miejscowościach.",
  "Przyczyną jest brak dojazdu i wyjazd młodszych, nie tylko brak spotkań.",
  "Mamy OPS i świetlicę. Mało osób, które mogą to prowadzić.",
  "Na pierwszy rok stać nas na część etatu koordynatora.",
];

function localQuestion(title: string, gminaName: string, turn: number) {
  const questions = [
    `Kto w gminie ${gminaName} najbardziej odczuwa problem, który ma rozwiązać „${title}”?`,
    "Co jest przyczyną, a nie tylko objawem? Na przykład brak dojazdu, wyjazd młodych albo usługa za daleko od domu.",
    "Co już u Was działa i kto może to prowadzić: OPS, CUS, szkoła, organizacja albo parafia?",
    "Jaki macie limit ludzi i pieniędzy na pierwszy rok tej usługi?",
  ];
  if (turn > 4) {
    return { reply: "Mam już dość, żeby naszkicować usługę dla tej gminy. Możesz przejść do projektu.", done: true };
  }
  return { reply: questions[Math.min(turn, 4) - 1] ?? questions[0], done: false };
}

function localReport(title: string, summary: string, gminaName: string, population: number): MiddlemanReport {
  const small = population < 8000;
  const costs = small
    ? [
        { item: "Koordynacja", amount_pln_per_year: 18000 },
        { item: "Dojazdy i materiały", amount_pln_per_year: 6000 },
        { item: "Spotkania z partnerami", amount_pln_per_year: 4000 },
      ]
    : [
        { item: "Koordynacja", amount_pln_per_year: 42000 },
        { item: "Dojazdy i materiały", amount_pln_per_year: 12000 },
        { item: "Spotkania z partnerami", amount_pln_per_year: 8000 },
      ];
  return {
    service_name: `${title} — ${gminaName}`,
    summary: `W ${gminaName} proponujemy oprzeć usługę na pomyśle „${title}”. ${summary} Koszt poniżej to szacunek orientacyjny, nie wycena.`,
    root_causes: small
      ? [
          "Pomoc jest daleko od domu, a część młodszych mieszkańców wyjeżdża.",
          "Widać objaw, a przyczyna leży w tym, jak pomoc jest zorganizowana.",
        ]
      : [
          "Ludzie często nie wiedzą, że pomoc już istnieje, albo czekają w kolejce.",
          "Usługa nie jest dopasowana do skali tej gminy.",
        ],
    service_description: summary || "Lokalna usługa prowadzona blisko domu, na bazie wybranej innowacji.",
    delivery_partners: ["gmina", "OPS", "organizacja społeczna"],
    staffing: "Jedna osoba koordynująca na część etatu. To założenie, dopóki instytucja nie poda etatów.",
    cost_estimate: costs,
    kpis: ["Liczba osób, które skorzystały w ciągu roku", "Liczba działań blisko domu"],
    risks: ["Za mało osób do prowadzenia", "Brak stałego finansowania po pilotażu"],
    usluga_wrazliwa_checklist: [
      { item: "Adaptacja gotowej innowacji", done: true },
      { item: "Grupa mieszkańców", done: false },
      { item: "Partnerzy", done: false },
      { item: "Kadra", done: false },
      { item: "Szacunek kosztów", done: true },
      { item: "Wskaźniki", done: true },
    ],
  };
}

export function MiddlemanClient() {
  const [role, setRole] = useState<Role>("mieszkaniec");
  const [ready, setReady] = useState(false);
  const [innovationQuery, setInnovationQuery] = useState("");
  const [innovationId, setInnovationId] = useState("");
  const [gminaName, setGminaName] = useState(gminas[0]?.name ?? "");
  const [started, setStarted] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<ChatTurn[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [report, setReport] = useState<MiddlemanReport | null>(null);
  const [error, setError] = useState("");
  const threadRef = useRef<HTMLDivElement>(null);

  const gmina = gminas.find((item) => item.name === gminaName) ?? gminas[0];
  const innovation = innovations.find((item) => item.id === innovationId);
  const openCall = calls.find((item) => item.is_open);
  const gminaPayload = useMemo(
    () =>
      gmina
        ? {
            name: gmina.name,
            type: gmina.type,
            population: gmina.population,
            population_trend: gmina.population_trend,
          }
        : { name: "", type: "wiejska", population: 0, population_trend: "stabilna" },
    [gmina],
  );

  const matches = useMemo(() => {
    const needle = innovationQuery.trim().toLocaleLowerCase("pl");
    const pool = needle
      ? innovations.filter((item) => item.title.toLocaleLowerCase("pl").includes(needle))
      : innovations;
    return pool.slice(0, 6);
  }, [innovationQuery]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setRole(currentRole());
      setReady(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    threadRef.current?.lastElementChild?.scrollIntoView({ block: "nearest" });
  }, [history, busy]);

  const userTurns = history.filter((item) => item.role === "user").length;
  const canDraft = done || userTurns >= 3;

  async function send(text: string) {
    if (!innovation || !gmina || busy) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    setBusy(true);
    setError("");
    setMessage("");
    const prior = history;
    try {
      const reply = await middlemanChat({
        innovation_id: innovation.id,
        gmina: gminaPayload,
        history: prior,
        message: trimmed,
      });
      setHistory([
        ...prior,
        { role: "user", content: trimmed },
        { role: "assistant", content: reply.reply },
      ]);
      setDone(reply.done);
    } catch {
      const turn = prior.filter((item) => item.role === "user").length + 1;
      const fallback = localQuestion(innovation.title, gmina.name, turn);
      setHistory([
        ...prior,
        { role: "user", content: trimmed },
        { role: "assistant", content: fallback.reply },
      ]);
      setDone(fallback.done);
      setError("Asystent odpowiedział z lokalnej podpowiedzi. Połączenie z modelem nie doszło.");
    } finally {
      setBusy(false);
    }
  }

  async function explain(index: number) {
    const item = history[index];
    if (!item || item.role !== "assistant" || busy) return;
    setBusy(true);
    try {
      const out = await simplify({ text: item.content });
      setHistory((current) => [...current, { role: "assistant", content: out.text }]);
    } catch {
      setError("Nie udało się uprościć tej wypowiedzi.");
    } finally {
      setBusy(false);
    }
  }

  async function buildReport() {
    if (!innovation || !gmina) return;
    setBusy(true);
    setError("");
    try {
      const out = await middlemanReport({
        innovation_id: innovation.id,
        gmina: gminaPayload,
        history,
      });
      setReport(out.report);
    } catch {
      setReport(localReport(innovation.title, innovation.summary, gmina.name, gmina.population));
      setError("Szkic powstał lokalnie, na podstawie wybranej innowacji i gminy.");
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return <p>Wczytuję…</p>;
  }

  if (!INSTITUTION_ROLES.includes(role)) {
    return (
      <section className="home-hero middleman-gate" aria-labelledby="middleman-gate">
        <div className="home-hero__copy">
          <p className="eyebrow">Dla instytucji</p>
          <h1 id="middleman-gate">Middleman zamienia innowację w usługę</h1>
          <p>
            To narzędzie dla gminy, OPS albo organizacji. Mieszkaniec szuka pomocy na stronie głównej.
            Tutaj dopasowujemy gotowy pomysł do miejsca i do programu „Usługa wrażliwa”.
          </p>
          <button
            type="button"
            className="middleman-primary"
            onClick={() => {
              writeCookie("role", "gmina");
              writeCookie("demo_email", "wojt@gmina-demo.pl");
              setRole("gmina");
            }}
          >
            Wchodzę jako instytucja
          </button>
        </div>
      </section>
    );
  }

  if (report && innovation && gmina) {
    const total = report.cost_estimate.reduce((sum, row) => sum + row.amount_pln_per_year, 0);
    return (
      <article className="knowledge-report print-report">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Szkic usługi</p>
            <h1>{report.service_name}</h1>
            <p>{report.summary}</p>
          </div>
          <button type="button" className="secondary-action print:hidden" onClick={() => window.print()}>
            Pobierz PDF
          </button>
        </div>
        {error ? <p role="status">{error}</p> : null}

        <section className="knowledge-report__brief" aria-labelledby="causes-title">
          <h2 id="causes-title">Przyczyny problemu</h2>
          <ul className="knowledge-report__list">
            {report.root_causes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="service-title">
          <h2 id="service-title">Usługa</h2>
          <p>{report.service_description}</p>
        </section>

        <section aria-labelledby="partners-title">
          <h2 id="partners-title">Partnerzy</h2>
          <ul className="knowledge-report__list">
            {report.delivery_partners.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="staff-title">
          <h2 id="staff-title">Kadra</h2>
          <p>{report.staffing}</p>
        </section>

        <section aria-labelledby="costs-title">
          <h2 id="costs-title">Koszty</h2>
          <div className="middleman-table-wrap">
            <table>
              <caption>Szacunek orientacyjny, złote na rok</caption>
              <thead>
                <tr>
                  <th scope="col">Pozycja</th>
                  <th scope="col">Kwota</th>
                </tr>
              </thead>
              <tbody>
                {report.cost_estimate.map((row) => (
                  <tr key={row.item}>
                    <th scope="row">{row.item}</th>
                    <td>{row.amount_pln_per_year.toLocaleString("pl-PL")} zł</td>
                  </tr>
                ))}
                <tr>
                  <th scope="row">Razem</th>
                  <td>{total.toLocaleString("pl-PL")} zł</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="kpi-title">
          <h2 id="kpi-title">Wskaźniki</h2>
          <ul className="knowledge-report__list">
            {report.kpis.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="risk-title">
          <h2 id="risk-title">Ryzyka</h2>
          <ul className="knowledge-report__list">
            {report.risks.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="check-title">
          <h2 id="check-title">Checklista „Usługa wrażliwa”</h2>
          <ul className="middleman-checks">
            {report.usluga_wrazliwa_checklist.map((item) => (
              <li key={item.item}>
                <span>{item.done ? "Jest" : "Do uzupełnienia"}</span>
                {item.item}
              </li>
            ))}
          </ul>
        </section>

        <section className="knowledge-report__brief" aria-labelledby="call-title">
          <h2 id="call-title">Dopasowanie do naboru</h2>
          {openCall ? (
            <>
              <p>
                Otwarty nabór: {openCall.name}. Termin: {openCall.deadline}. Limit:{" "}
                {openCall.budget_max.toLocaleString("pl-PL")} zł.
              </p>
              <p>{openCall.description}</p>
            </>
          ) : (
            <p>Teraz żaden nabór demonstracyjny nie jest otwarty.</p>
          )}
          <p>
            „Usługa wrażliwa” finansuje adaptację gotowej innowacji do lokalnej usługi, nie pomysł od zera.
            Ten szkic startuje od „{innovation.title}” w gminie {gmina.name}.
          </p>
        </section>

        <button
          type="button"
          className="secondary-action print:hidden"
          onClick={() => {
            setReport(null);
            setStarted(false);
            setHistory([]);
            setDone(false);
            setError("");
          }}
        >
          Nowa rozmowa
        </button>
      </article>
    );
  }

  return (
    <div className="home-flow">
      <section className="home-hero" aria-labelledby="middleman-title">
        <div className="home-hero__copy">
          <p className="eyebrow">Dla instytucji</p>
          <h1 id="middleman-title">Zamień innowację w lokalną usługę</h1>
          <p>
            Wybierz gotowy pomysł i gminę. Asystent dopyta o przyczynę problemu i ułoży szkic pod
            „Usługę wrażliwą”.
          </p>
        </div>
      </section>

      <section className="middleman-setup" aria-labelledby="setup-title">
        <h2 id="setup-title">Co i gdzie chcecie wdrożyć</h2>
        <div className="middleman-setup__grid">
          <div>
            <label htmlFor="innovation-search">Innowacja</label>
            <div className="middleman-search">
              <Search aria-hidden="true" />
              <input
                id="innovation-search"
                value={innovationQuery}
                onChange={(event) => setInnovationQuery(event.target.value)}
                placeholder="Wpisz fragment tytułu"
                disabled={started}
              />
            </div>
            <ul className="middleman-picks" aria-label="Pasujące innowacje">
              {matches.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-pressed={item.id === innovationId}
                    disabled={started}
                    onClick={() => setInnovationId(item.id)}
                  >
                    <strong>{item.title}</strong>
                    <span>{item.summary}</span>
                  </button>
                </li>
              ))}
              {matches.length === 0 ? <li>Nie ma innowacji o takim tytule.</li> : null}
            </ul>
          </div>
          <div>
            <label htmlFor="gmina">Gmina</label>
            <select
              id="gmina"
              value={gminaName}
              disabled={started}
              onChange={(event) => setGminaName(event.target.value)}
            >
              {gminas.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
            {gmina ? (
              <dl className="middleman-gmina">
                <div>
                  <dt>Typ</dt>
                  <dd>{gmina.type}</dd>
                </div>
                <div>
                  <dt>Mieszkańcy</dt>
                  <dd>{gmina.population.toLocaleString("pl-PL")}</dd>
                </div>
                <div>
                  <dt>Trend</dt>
                  <dd>{gmina.population_trend}</dd>
                </div>
                <div>
                  <dt>Powiat</dt>
                  <dd>{gmina.powiat}</dd>
                </div>
              </dl>
            ) : null}
          </div>
        </div>
        {innovation ? <p className="middleman-chosen">Wybrana innowacja: {innovation.title}.</p> : null}
        {!started ? (
          <button
            type="button"
            className="middleman-primary"
            disabled={!innovation || !gmina}
            onClick={() => {
              setStarted(true);
              void send("Chcemy wdrożyć tę innowację w naszej gminie. Pomóż ułożyć z niej usługę.");
            }}
          >
            Rozpocznij rozmowę
          </button>
        ) : null}
      </section>

      {started ? (
        <section className="middleman-chat" aria-labelledby="chat-title">
          <h2 id="chat-title">Rozmowa</h2>
          <div ref={threadRef} role="log" aria-live="polite" aria-relevant="additions" className="middleman-thread">
            {history.map((item, index) => (
              <div key={`${item.role}-${index}`} className={item.role === "user" ? "is-user" : "is-assistant"}>
                <p className="middleman-thread__who">{item.role === "user" ? "Wy" : "Middleman"}</p>
                <p>{item.content}</p>
                {item.role === "assistant" ? (
                  <button type="button" onClick={() => void explain(index)} disabled={busy}>
                    Wyjaśnij prościej
                  </button>
                ) : null}
              </div>
            ))}
            {busy ? (
              <p className="middleman-wait">
                <LoaderCircle aria-hidden="true" className="animate-spin" /> Przygotowuję odpowiedź…
              </p>
            ) : null}
          </div>
          {error ? <p role="alert">{error}</p> : null}
          <ul className="prompt-list middleman-suggestions">
            {SUGGESTIONS.map((prompt) => (
              <li key={prompt}>
                <button type="button" onClick={() => void send(prompt)} disabled={busy}>
                  {prompt}
                </button>
              </li>
            ))}
          </ul>
          <form
            className="middleman-composer"
            onSubmit={(event) => {
              event.preventDefault();
              void send(message);
            }}
          >
            <label htmlFor="middleman-message">Twoja odpowiedź</label>
            <textarea
              id="middleman-message"
              value={message}
              rows={3}
              onChange={(event) => setMessage(event.target.value)}
            />
            <div className="middleman-actions">
              <button type="submit" className="middleman-primary" disabled={busy || !message.trim()}>
                Wyślij
              </button>
              <button
                type="button"
                className="secondary-action"
                disabled={busy || !canDraft}
                onClick={() => void buildReport()}
              >
                Przygotuj projekt usługi
              </button>
            </div>
          </form>
        </section>
      ) : null}
    </div>
  );
}
