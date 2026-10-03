"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { InnovationCard } from "@/components/innovation-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { findInnovationByTitle, gminas, innovations } from "@/content/catalog";
import { categoryLabel } from "@/lib/categories";
import { match, simplify } from "@/lib/api";
import { currentRole } from "@/lib/demo-session";
import type { MatchResponse } from "@/lib/types";

const CHIPS = [
  "Słabo widzę. Chcę wiedzieć, z jakich innowacji w Małopolsce mogę skorzystać. Pokaż mi to, co jest dla osób takich jak ja.",
  "Mam syna z niepełnosprawnością. Jakie projekty i innowacje w Małopolsce mogą nam pomóc? Chcę też zgłosić mały pomysł z naszej gminy.",
  "Starsi sąsiedzi są samotni i nie mogą dojechać do lekarza. Mieszkam w wiejskiej gminie.",
];

const WEAK = 0.5;

type SpeechCtor = new () => {
  lang: string;
  interimResults: boolean;
  onresult: ((event: { results: { 0: { 0: { transcript: string } } } }) => void) | null;
  start: () => void;
};

export function DopasujClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [voice, setVoice] = useState(false);
  const [result, setResult] = useState<MatchResponse | null>(null);
  const [simpleWhy, setSimpleWhy] = useState<Record<number, string>>({});

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const Ctor = (window as unknown as {
        SpeechRecognition?: SpeechCtor;
        webkitSpeechRecognition?: SpeechCtor;
      }).SpeechRecognition ??
        (window as unknown as { webkitSpeechRecognition?: SpeechCtor })
          .webkitSpeechRecognition;
      setVoice(Boolean(Ctor));
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const initial = searchParams.get("q");
    if (initial) void run(initial, location);
    // run once on mount for ?q=
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (result && headingRef.current) headingRef.current.focus();
  }, [result]);

  async function run(text: string, loc: string) {
    const trimmed = text.trim();
    if (!trimmed) {
      setError("Wpisz, czego szukasz.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const data = await match({
        query: trimmed,
        location: loc || undefined,
        role: currentRole(),
      });
      setResult(data);
      router.replace(`/dopasuj?q=${encodeURIComponent(trimmed)}`, { scroll: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się wyszukać.");
    } finally {
      setLoading(false);
    }
  }

  function listen() {
    const Ctor = (window as unknown as {
      SpeechRecognition?: SpeechCtor;
      webkitSpeechRecognition?: SpeechCtor;
    }).webkitSpeechRecognition ??
      (window as unknown as { SpeechRecognition?: SpeechCtor }).SpeechRecognition;
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = "pl-PL";
    rec.interimResults = false;
    rec.onresult = (event) => {
      const said = event.results[0][0].transcript;
      setQuery(said);
    };
    rec.start();
  }

  const top = result?.results[0]?.score ?? 0;
  const weak = Boolean(result && (result.results.length === 0 || top < WEAK));

  return (
    <div>
      <h1
        ref={result && !loading ? headingRef : undefined}
        id={result && !loading ? "wyniki" : undefined}
        tabIndex={result && !loading ? -1 : undefined}
        className="text-3xl font-bold outline-none"
      >
        {result && !loading
          ? "Znaleźliśmy rozwiązania pasujące do Twojej sytuacji"
          : "Z czym masz teraz trudność?"}
      </h1>
      {!result ? (
        <p className="mt-3 max-w-prose">Napisz, co się dzieje i czego potrzebujesz.</p>
      ) : null}

      <form
        className="mt-6 max-w-2xl space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void run(query, location);
        }}
      >
        <div>
          <Label htmlFor="problem">Opisz swoją sytuację (wymagane)</Label>
          <Textarea
            id="problem"
            name="q"
            required
            value={query}
            placeholder="Na przykład: Nie mam jak dojechać do lekarza."
            aria-describedby="problem-hint"
            onChange={(event) => setQuery(event.target.value)}
          />
          <p id="problem-hint" className="mt-1">
            Możesz napisać jedno zdanie albo opisać więcej szczegółów.
          </p>
        </div>
        {voice ? (
          <Button type="button" variant="outline" onClick={listen}>
            Powiedz, z czym potrzebujesz pomocy
          </Button>
        ) : null}
        <div>
          <Label htmlFor="location">Gmina (opcjonalnie)</Label>
          <select
            id="location"
            className="mt-1 h-11 min-h-11 w-full rounded-lg border border-input bg-card px-3"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
          >
            <option value="">Cała Małopolska</option>
            {gminas.map((item) => (
              <option key={item.name} value={item.name}>
                {item.name} ({item.type})
              </option>
            ))}
          </select>
        </div>
        <div>
          <p className="mb-2 font-medium">Przykłady</p>
          <ul className="flex flex-col gap-2">
            {CHIPS.map((chip) => (
              <li key={chip}>
                <button
                  type="button"
                  className="w-full rounded-lg border px-3 py-3 text-left"
                  onClick={() => {
                    setQuery(chip);
                    void run(chip, location);
                  }}
                >
                  {chip}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <Button type="submit">Znajdź pomoc</Button>
      </form>

      <p className="mt-4" aria-live="polite">
        {loading ? "Szukam rozwiązań, które mogą Ci pomóc…" : ""}
        {error}
      </p>

      {result && !loading ? (
        <section className="mt-10">
          <p className="mt-2">
            Zrozumieliśmy, że chodzi o: {categoryLabel(result.extracted.category)},{" "}
            {result.extracted.target_group}
            {result.extracted.location ? `, ${result.extracted.location}` : ""}.{" "}
            <button
              type="button"
              className="underline"
              onClick={() => document.getElementById("problem")?.focus()}
            >
              Edytuj
            </button>
          </p>
          {result.similar_needs.count ? (
            <p className="mt-2">
              {result.similar_needs.count} osób zgłosiło podobny problem.
              {result.similar_needs.example
                ? ` Na przykład: ${result.similar_needs.example}`
                : ""}
            </p>
          ) : null}

          {weak ? (
            <p className="mt-6">
              Nie znaleźliśmy jeszcze dobrego rozwiązania.{" "}
              <Link
                className="underline underline-offset-4"
                href={`/kreator/fiszka?problem=${encodeURIComponent(query)}`}
              >
                Zgłoś to jako nowy pomysł
              </Link>
            </p>
          ) : (
            <ul className="mt-6 grid gap-4">
              {result.results.map((item, index) => {
                const catalog =
                  findInnovationByTitle(item.title) ??
                  innovations.find((row) => row.category === item.category);
                if (!catalog) return null;
                return (
                  <li key={`${item.title}-${index}`}>
                    <InnovationCard
                      innovation={catalog}
                      why={simpleWhy[index] ?? item.why}
                    />
                    <p className="mt-2">
                      <button
                        type="button"
                        className="underline underline-offset-4"
                        onClick={async () => {
                          const out = await simplify({
                            text: simpleWhy[index] ?? item.why,
                          });
                          setSimpleWhy((prev) => ({ ...prev, [index]: out.text }));
                        }}
                      >
                        Wyjaśnij prościej
                      </button>
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
