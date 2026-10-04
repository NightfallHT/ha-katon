"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  FileCheck2,
  Landmark,
  Lightbulb,
  LoaderCircle,
  MessageCircleMore,
  Search,
  Share2,
} from "lucide-react";
import { match } from "@/lib/api";
import type { MatchResponse } from "@/lib/types";
import {
  findInnovationByTitle,
  materials,
  type Material,
} from "@/content/catalog";

const PROMPTS = [
  "Szukam wsparcia dla _____ w zakresie _____.",
  "W mojej gminie problemem jest _____. Potrzebujemy _____.",
  "Chcę znaleźć inicjatywę dla _____, która pomoże w _____.",
];

const FEATURES = [
  {
    href: "/zasobnik",
    title: "Zasobnik wiedzy",
    text: "Zapytaj o temat i otrzymaj raport oparty na innowacjach, danych i materiałach.",
    icon: BookOpen,
  },
  {
    href: "/kreator/fiszka",
    title: "Zgłoś pomysł",
    text: "Uporządkuj problem i zamień pierwszą myśl w czytelną fiszkę.",
    icon: Lightbulb,
  },
  {
    href: "/kreator/grant",
    title: "Złóż wniosek o grant",
    text: "Sprawdź aktualny nabór, regulamin i przygotuj wniosek w jednym formularzu.",
    icon: FileCheck2,
  },
  {
    href: "/kreator/dobra-praktyka",
    title: "Podziel się dobrą praktyką",
    text: "Pokaż rozwiązanie, które już działa i może pomóc innym.",
    icon: Share2,
  },
  {
    href: "/middleman",
    title: "Zamień innowację w usługę",
    text: "Dla instytucji: dopracuj gotowy pomysł pod swoją gminę i pod Usługę wrażliwą.",
    icon: Landmark,
  },
  {
    href: "/kontakt",
    title: "Komunikacja z ROPS",
    text: "Napisz do zespołu, jeśli potrzebujesz odpowiedzi albo wsparcia człowieka.",
    icon: MessageCircleMore,
  },
];

function helpfulMaterials(query: string, response: MatchResponse): Material[] {
  const words = new Set(
    `${query} ${response.extracted.keywords.join(" ")}`
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3),
  );
  return [...materials]
    .map((item) => ({
      item,
      score: `${item.title} ${item.description} ${item.tags.join(" ")}`
        .toLowerCase()
        .split(/\s+/)
        .reduce((sum, word) => sum + (words.has(word) ? 1 : 0), 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ item }) => item);
}

export function HomeClient() {
  const [query, setQuery] = useState("");
  const [audience, setAudience] = useState<"person" | "institution">("person");
  const [response, setResponse] = useState<MatchResponse | null>(null);
  const [searchedQuery, setSearchedQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const resultsRef = useRef<HTMLHeadingElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  function choosePrompt(template: string) {
    setQuery(template);
    setResponse(null);
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
      const result = await match({
        query: text,
        role: audience === "person" ? "mieszkaniec" : "gmina",
      });
      setResponse(result);
      setSearchedQuery(text);
      requestAnimationFrame(() => resultsRef.current?.focus());
    } catch {
      setError("Nie udało się teraz wyszukać rozwiązań. Spróbuj ponownie.");
    } finally {
      setBusy(false);
    }
  }

  const suggestedMaterials = response
    ? helpfulMaterials(searchedQuery, response)
    : [];

  return (
    <>
      {/* Same place and same look as the back link every subpage gets, so the
          way out of the results is where people already expect it. */}
      {response ? (
        <button
          type="button"
          className="back-home"
          onClick={() => {
            setResponse(null);
            setQuery("");
            setSearchedQuery("");
            setError("");
            requestAnimationFrame(() => titleRef.current?.focus());
          }}
        >
          <ArrowLeft aria-hidden="true" />
          Wróć do widoku głównego
        </button>
      ) : null}

      <div className="home-flow">
        <section className="home-hero" aria-labelledby="home-title">
          <div className="home-hero__copy">
            <p className="eyebrow">Jedno miejsce. Wiele możliwych rozwiązań.</p>
            {/* Focused when the user returns from results, so screen readers
                land back at the top of the default view. */}
            <h1 id="home-title" ref={titleRef} tabIndex={-1}>
              Znajdź inicjatywę, która pasuje do Twojej sytuacji
            </h1>
            <p>
              Opisz sprawę własnymi słowami. Nie musisz znać nazwy programu ani
              urzędowego języka.
            </p>
          </div>

          <form className="search-panel" onSubmit={search}>
            <label htmlFor="problem">Czego szukasz? <span>(wymagane)</span></label>
            <div className="search-panel__field">
              <textarea
                ref={inputRef}
                id="problem"
                name="query"
                required
                rows={4}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Na przykład: Szukam wsparcia dla starszej osoby, która nie może dojechać do lekarza."
                aria-describedby={error ? "home-search-error" : undefined}
              />
              <fieldset className="audience-switch">
                <legend>Szukam dla</legend>
                <label>
                  <input
                    type="radio"
                    name="audience"
                    value="person"
                    checked={audience === "person"}
                    onChange={() => setAudience("person")}
                  />
                  <span>Osoby fizycznej</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="audience"
                    value="institution"
                    checked={audience === "institution"}
                    onChange={() => setAudience("institution")}
                  />
                  <span>Instytucji</span>
                </label>
              </fieldset>
              <button type="submit" disabled={busy}>
                {busy ? (
                  <LoaderCircle aria-hidden="true" className="animate-spin" />
                ) : (
                  <Search aria-hidden="true" />
                )}
                {busy ? "Szukam…" : "Znajdź inicjatywy"}
              </button>
            </div>
            <p className="search-panel__hint">
              Możesz opisać osobę, miejsce, barierę albo potrzebę.
            </p>
            {error ? (
              <p id="home-search-error" role="alert" className="form-error">
                {error}
              </p>
            ) : null}
          </form>
        </section>

        {response ? (
          <section className="search-results" aria-labelledby="wyniki">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Najlepsze dopasowania</p>
                <h1 id="wyniki" ref={resultsRef} tabIndex={-1}>
                  Innowacje dla Twojej sprawy
                </h1>
                <p>
                  Szukasz dla: {audience === "person" ? "osoby fizycznej" : "instytucji"}.{" "}
                  Zrozumieliśmy: {response.extracted.target_group}
                  {response.extracted.location
                    ? ` · ${response.extracted.location}`
                    : ""}
                </p>
              </div>
              <button
                type="button"
                className="secondary-action"
                onClick={() => {
                  setResponse(null);
                  requestAnimationFrame(() => inputRef.current?.focus());
                }}
              >
                Zmień wyszukiwanie
              </button>
            </div>

            {response.results.length ? (
              <ol className="result-title-list">
                {response.results.map((result, index) => {
                  const innovation = findInnovationByTitle(result.title);
                  const href = innovation
                    ? `/biblioteka/${innovation.id}`
                    : "/biblioteka";
                  return (
                    <li key={`${result.innovation_id}-${result.title}`}>
                      <span className="result-title-list__number" aria-hidden="true">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h2>
                          <Link href={href}>{result.title}</Link>
                        </h2>
                        <p>{result.why}</p>
                      </div>
                      <ArrowRight aria-hidden="true" />
                    </li>
                  );
                })}
              </ol>
            ) : (
              <div className="empty-result">
                <h2>Nie znaleźliśmy gotowego rozwiązania</h2>
                <p>Możesz opisać nowy pomysł i przesłać go do ROPS.</p>
                <Link href={`/kreator/fiszka?problem=${encodeURIComponent(searchedQuery)}`}>
                  Przejdź do Kreatora
                </Link>
              </div>
            )}

            <div className="materials-block">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Do przeczytania</p>
                  <h2>Pomocne materiały</h2>
                </div>
                <Link href="/materialy">Zobacz wszystkie materiały</Link>
              </div>
              <ul>
                {suggestedMaterials.map((item) => (
                  <li key={item.title}>
                    <a href={item.url || "/materialy"}>
                      <span>{item.type}</span>
                      <strong>{item.title}</strong>
                      <p>{item.description}</p>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : (
          <>
            <section className="prompt-section" aria-labelledby="prompt-title">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Nie wiesz, jak zacząć?</p>
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

            <section className="feature-section" aria-labelledby="feature-title">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Co chcesz zrobić?</p>
                  <h2 id="feature-title">Wszystkie funkcje w jednym miejscu</h2>
                </div>
              </div>
              <ul className="feature-grid">
                {FEATURES.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <li key={feature.href}>
                      <Link href={feature.href}>
                        <span className="feature-grid__icon">
                          <Icon aria-hidden="true" />
                        </span>
                        <h3>{feature.title}</h3>
                        <p>{feature.text}</p>
                        <span className="feature-grid__link">
                          Otwórz <ArrowRight aria-hidden="true" />
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          </>
        )}
      </div>
    </>
  );
}
