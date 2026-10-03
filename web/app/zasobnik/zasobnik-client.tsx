"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { LoaderCircle, Search } from "lucide-react";
import { knowledgeReport } from "@/lib/api";
import type { KnowledgeReport } from "@/lib/types";
import { findInnovationByTitle } from "@/content/catalog";

const PROMPTS = [
  "Chcę zrozumieć, co działa w temacie _____ w Małopolsce.",
  "Szukam wiedzy o wsparciu dla _____ w gminie _____.",
  "Jakie innowacje i materiały pomagają przy _____?",
];

export function ZasobnikClient() {
  const [query, setQuery] = useState("");
  const [report, setReport] = useState<KnowledgeReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  function choosePrompt(template: string) {
    setQuery(template);
    setReport(null);
    setError("");
    requestAnimationFrame(() => {
      const field = inputRef.current;
      if (!field) return;
      const start = template.indexOf("_____");
      field.focus();
      field.setSelectionRange(start, start + 5);
    });
  }

  async function search(event: React.FormEvent) {
    event.preventDefault();
    const text = query.trim();
    if (!text || busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await knowledgeReport({ query: text, audience: "person" });
      setReport(result);
      requestAnimationFrame(() => titleRef.current?.focus());
    } catch {
      setError("Nie udało się teraz przygotować raportu. Spróbuj ponownie.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="home-flow">
      <section className="home-hero" aria-labelledby="zasobnik-title">
        <div className="home-hero__copy">
          <p className="eyebrow">Zasobnik wiedzy</p>
          <h1 id="zasobnik-title">Zapytaj o temat i otrzymaj czytelny raport</h1>
          <p>
            Szukamy w innowacjach, materiałach i tym, co już działa. Odpowiedź
            jest podzielona na krótkie sekcje.
          </p>
        </div>

        <form className="search-panel" onSubmit={search}>
          <label htmlFor="knowledge-query">
            Czego chcesz się dowiedzieć? <span>(wymagane)</span>
          </label>
          <div className="search-panel__field search-panel__field--simple">
            <textarea
              ref={inputRef}
              id="knowledge-query"
              name="query"
              required
              rows={4}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Na przykład: Co już działa w wsparciu samotnych seniorów?"
              aria-describedby={error ? "knowledge-error" : undefined}
            />
            <button type="submit" disabled={busy}>
              {busy ? (
                <LoaderCircle aria-hidden="true" className="animate-spin" />
              ) : (
                <Search aria-hidden="true" />
              )}
              {busy ? "Przygotowuję raport…" : "Przygotuj raport"}
            </button>
          </div>
          {error ? (
            <p id="knowledge-error" role="alert" className="form-error">
              {error}
            </p>
          ) : null}
        </form>
      </section>

      {report ? (
        <article className="knowledge-report" aria-labelledby="report-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Raport</p>
              <h1 id="report-title" ref={titleRef} tabIndex={-1}>
                {report.title}
              </h1>
            </div>
            <button
              type="button"
              className="secondary-action"
              onClick={() => {
                setReport(null);
                requestAnimationFrame(() => inputRef.current?.focus());
              }}
            >
              Nowe pytanie
            </button>
          </div>

          <section className="knowledge-report__brief" aria-labelledby="brief-title">
            <h2 id="brief-title">W skrócie</h2>
            <ul className="knowledge-report__metrics">
              {report.metrics.map((metric) => (
                <li key={`${metric.value}-${metric.label}`}>
                  <strong>{metric.value}</strong>
                  <span>{metric.label}</span>
                </li>
              ))}
            </ul>
            <p>{report.summary}</p>
          </section>

          <section aria-labelledby="works-title">
            <h2 id="works-title">Co już działa</h2>
            <ul className="knowledge-report__list">
              {report.what_works.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="innos-title">
            <h2 id="innos-title">Innowacje</h2>
            <ol className="result-title-list">
              {report.innovations.map((item, index) => {
                const found = findInnovationByTitle(item.title);
                const href = found ? `/biblioteka/${found.id}` : "/biblioteka";
                return (
                  <li key={`${item.innovation_id}-${item.title}`}>
                    <span className="result-title-list__number" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3>
                        <Link href={href}>{item.title}</Link>
                      </h3>
                      <p>{item.summary}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          <section className="materials-block" aria-labelledby="more-title">
            <h2 id="more-title">Dowiedz się więcej</h2>
            <p>Materiały</p>
            <ul>
              {report.materials.map((item) => (
                <li key={item.title}>
                  <a href={item.url || "/materialy"}>
                    <span>Materiał</span>
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </article>
      ) : (
        <section className="prompt-section" aria-labelledby="prompt-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Nie wiesz, jak zapytać?</p>
              <h2 id="prompt-title">Uzupełnij przykładowe zdanie</h2>
            </div>
            <p>Kliknij przykład. Kursor zatrzyma się w pierwszej luce.</p>
          </div>
          <ul className="prompt-list">
            {PROMPTS.map((prompt) => (
              <li key={prompt}>
                <button type="button" onClick={() => choosePrompt(prompt)}>
                  {prompt}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
