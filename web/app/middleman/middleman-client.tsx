"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { gminas, innovations } from "@/content/catalog";
import { currentRole, writeCookie, type Role } from "@/lib/demo-session";
import { middlemanChat, middlemanReport } from "@/lib/api";
import { categoryLabel } from "@/lib/categories";
import type { ChatTurn, MiddlemanReport } from "@/lib/types";

export function MiddlemanClient() {
  const [role, setRole] = useState<Role>("mieszkaniec");
  const [innovationId, setInnovationId] = useState(innovations[0]?.id ?? "");
  const [gminaName, setGminaName] = useState(gminas[0]?.name ?? "");
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<ChatTurn[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [report, setReport] = useState<MiddlemanReport | null>(null);
  const [error, setError] = useState("");

  const gmina = gminas.find((item) => item.name === gminaName) ?? gminas[0];
  const innovation = innovations.find((item) => item.id === innovationId) ?? innovations[0];
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

  useEffect(() => {
    setRole(currentRole());
  }, []);

  if (role !== "gmina") {
    return (
      <div>
        <h1 className="text-3xl font-bold">Ta część jest dla gmin</h1>
        <p className="mt-3 max-w-prose">
          Przełącz rolę na „Gmina”, żeby przygotować projekt usługi.
        </p>
        <Button
          className="mt-4"
          type="button"
          onClick={() => {
            writeCookie("role", "gmina");
            writeCookie("demo_email", "wojt@gmina-demo.pl");
            setRole("gmina");
          }}
        >
          Przełącz na: Gmina
        </Button>
      </div>
    );
  }

  async function send() {
    if (!innovation) return;
    const text = message.trim() || "Jakie są główne przyczyny tego problemu w naszej gminie?";
    setBusy(true);
    setError("");
    try {
      const reply = await middlemanChat({
        innovation_id: innovation.id,
        gmina: gminaPayload,
        history,
        message: text,
      });
      const next: ChatTurn[] = [
        ...history,
        { role: "user", content: text },
        { role: "assistant", content: reply.reply },
      ];
      setHistory(next);
      setDone(reply.done || next.filter((item) => item.role === "user").length >= 3);
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się wysłać wiadomości.");
      setDone(true);
    } finally {
      setBusy(false);
    }
  }

  async function buildReport() {
    if (!innovation) return;
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
      setReport({
        service_name: `Usługa blisko domu — ${gminaPayload.name}`,
        summary:
          "Gmina wdraża mobilne wsparcie, żeby starsze osoby nie zostawały bez dojazdu do lekarza.",
        root_causes: [
          "Rozproszone osadnictwo",
          "Słaby transport publiczny",
          "Samotność seniorów",
        ],
        service_description:
          "Raz w tygodniu bus i dyżur koordynatora łączą mieszkańców z przychodnią i OPS.",
        delivery_partners: ["OPS", "lokalne NGO", "przychodnia"],
        staffing: "1 koordynator na 0,5 etatu i 2 kierowców w dyżurze.",
        cost_estimate: [
          { item: "Koordynacja", amount_pln_per_year: 48000 },
          { item: "Transport", amount_pln_per_year: 36000 },
        ],
        kpis: ["Liczba kursów", "Liczba osób, które dojechały do lekarza"],
        risks: ["Brak kierowców", "Niska frekwencja zimą"],
        usluga_wrazliwa_checklist: [
          { item: "Opis grupy mieszkańców", done: true },
          { item: "Partnerzy i koszt", done: true },
          { item: "Wskaźniki", done: true },
        ],
      });
    } finally {
      setBusy(false);
    }
  }

  if (report) {
    const total = report.cost_estimate.reduce((sum, row) => sum + row.amount_pln_per_year, 0);
    return (
      <article className="print-report space-y-6">
        <h1 className="text-3xl font-bold">{report.service_name}</h1>
        <p>{report.summary}</p>
        <section>
          <h2 className="text-2xl font-bold">Przyczyny problemu</h2>
          <ul className="list-disc pl-6">
            {report.root_causes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="text-2xl font-bold">Projekt usługi</h2>
          <p>{report.service_description}</p>
        </section>
        <section>
          <h2 className="text-2xl font-bold">Partnerzy</h2>
          <ul className="list-disc pl-6">
            {report.delivery_partners.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="text-2xl font-bold">Kadra</h2>
          <p>{report.staffing}</p>
        </section>
        <section>
          <h2 className="text-2xl font-bold">Koszty</h2>
          <table className="w-full border-collapse text-left">
            <caption className="mb-2 text-left">Szacunek roczny</caption>
            <thead>
              <tr className="border-b">
                <th scope="col" className="py-2">
                  Pozycja
                </th>
                <th scope="col" className="py-2">
                  Kwota (zł / rok)
                </th>
              </tr>
            </thead>
            <tbody>
              {report.cost_estimate.map((row) => (
                <tr key={row.item} className="border-b">
                  <th scope="row" className="py-2 font-medium">
                    {row.item}
                  </th>
                  <td className="py-2">{row.amount_pln_per_year.toLocaleString("pl-PL")}</td>
                </tr>
              ))}
              <tr>
                <th scope="row" className="py-2">
                  Razem
                </th>
                <td className="py-2">{total.toLocaleString("pl-PL")}</td>
              </tr>
            </tbody>
          </table>
        </section>
        <section>
          <h2 className="text-2xl font-bold">Wskaźniki</h2>
          <ul className="list-disc pl-6">
            {report.kpis.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="text-2xl font-bold">Ryzyka</h2>
          <ul className="list-disc pl-6">
            {report.risks.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="text-2xl font-bold">Checklista Usługa wrażliwa</h2>
          <ul>
            {report.usluga_wrazliwa_checklist.map((item) => (
              <li key={item.item}>
                {item.done ? "Zrobione" : "Do uzupełnienia"}: {item.item}
              </li>
            ))}
          </ul>
        </section>
        <Button type="button" className="print:hidden" onClick={() => window.print()}>
          Pobierz PDF
        </Button>
      </article>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dopasuj innowację do potrzeb swojej gminy</h1>
      <p>Odpowiedz na kilka pytań. Przygotujemy propozycję lokalnej usługi.</p>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="innovation">Innowacja</Label>
          <select
            id="innovation"
            className="mt-1 h-11 min-h-11 w-full rounded-lg border bg-card px-3"
            value={innovationId}
            onChange={(event) => setInnovationId(event.target.value)}
          >
            {innovations.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title} ({categoryLabel(item.category)})
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="gmina">Gmina</Label>
          <select
            id="gmina"
            className="mt-1 h-11 min-h-11 w-full rounded-lg border bg-card px-3"
            value={gminaName}
            onChange={(event) => setGminaName(event.target.value)}
          >
            {gminas.map((item) => (
              <option key={item.name} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {gmina && innovation ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{gmina.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Typ: {gmina.type}. Mieszkańców: {gmina.population.toLocaleString("pl-PL")}. Trend:{" "}
              {gmina.population_trend}. Powiat: {gmina.powiat}.
            </p>
            <p className="mt-2">Wybrana innowacja: {innovation.title}.</p>
          </CardContent>
        </Card>
      ) : null}

      <div aria-live="polite" className="space-y-3">
        {history.map((item, index) => (
          <p key={index}>
            <strong>{item.role === "user" ? "Ty" : "Asystent"}: </strong>
            {item.content}
          </p>
        ))}
        {busy ? <p>Przygotowuję odpowiedź…</p> : null}
        {error ? <p role="alert">{error}</p> : null}
      </div>

      <form
        className="max-w-2xl space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <Label htmlFor="message">Twoja wiadomość</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={busy}>
            Wyślij
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy || (!done && history.filter((i) => i.role === "user").length < 3)}
            onClick={() => void buildReport()}
          >
            Mam dość informacji — przygotuj projekt usługi
          </Button>
        </div>
      </form>
    </div>
  );
}
