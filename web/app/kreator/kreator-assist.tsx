"use client";

import { useState } from "react";
import { kreatorAssist, simplify } from "@/lib/api";
import type { ChatTurn, Fiszka } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  fiszka: Fiszka;
  onApply: (fields: Partial<Fiszka>) => void;
};

// Shown when the AI service cannot be reached. No canned suggestions are made up.
const OFFLINE_REPLY =
  "Asystent AI jest teraz niedostępny. Wypełnij fiszkę samodzielnie albo spróbuj ponownie za chwilę.";

export function KreatorAssist({ fiszka, onApply }: Props) {
  const [open, setOpen] = useState(true);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [history, setHistory] = useState<ChatTurn[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [pending, setPending] = useState<Partial<Fiszka>>({});

  async function send(message: string) {
    const trimmed = message.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setStatus("Asystent myśli…");
    setText("");
    const nextHistory = [...history, { role: "user" as const, content: trimmed }];
    try {
      const data = await kreatorAssist({ fiszka, message: trimmed, history });
      applyReply(nextHistory, data.reply, data.suggestions, data.updated_fields);
    } catch {
      applyReply(nextHistory, OFFLINE_REPLY, [], {});
    } finally {
      setBusy(false);
      setStatus("");
    }
  }

  function applyReply(
    nextHistory: ChatTurn[],
    reply: string,
    nextSuggestions: string[],
    fields: Partial<Fiszka>,
  ) {
    setHistory([...nextHistory, { role: "assistant", content: reply }]);
    setSuggestions(nextSuggestions ?? []);
    setPending(fields ?? {});
    if (fields && Object.keys(fields).length) onApply(fields);
  }

  async function simpler(index: number) {
    const target = history[index];
    if (!target || target.role !== "assistant" || busy) return;
    setBusy(true);
    setStatus("Upraszczam odpowiedź…");
    try {
      const out = await simplify({ text: target.content });
      setHistory((h) => [...h, { role: "assistant", content: out.text }]);
    } catch {
      const short = target.content.split(/(?<=[.!?])\s+/).slice(0, 2).join(" ");
      setHistory((h) => [
        ...h,
        { role: "assistant", content: short || "Krótko: opisz problem zwykłym zdaniem." },
      ]);
    } finally {
      setBusy(false);
      setStatus("");
    }
  }

  return (
    // Rendered inside the form's <aside className="flat-form__aside">, which supplies the
    // card, heading and landmark; a second <aside> here would duplicate both.
    <div className="min-w-0">
      <button
        type="button"
        className="flex min-h-11 w-full items-center justify-between gap-3 text-left font-semibold"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        Asystent pomysłu
        <span aria-hidden="true">{open ? "▾" : "▸"}</span>
      </button>
      {open ? (
        <div className="mt-3 space-y-3">
          <p className="text-muted-foreground">
            Zadaj pytanie. Do fiszki wpisuję tylko po Twojej zgodzie („tak, wpisz”).
          </p>
          <div role="log" aria-live="polite" aria-label="Rozmowa z asystentem" className="max-h-64 space-y-3 overflow-y-auto">
            {history.length === 0 ? <p>Możesz napisać: „Pomóż mi opisać problem.”</p> : null}
            {history.map((item, index) => (
              <div key={`${item.role}-${index}`} className="rounded-xl border p-3">
                <p className="font-medium">{item.role === "user" ? "Ty" : "Asystent"}</p>
                <p className="whitespace-pre-wrap">{item.content}</p>
                {item.role === "assistant" ? (
                  <button
                    type="button"
                    className="mt-2 min-h-11 rounded-full border px-3 font-medium"
                    onClick={() => void simpler(index)}
                    disabled={busy}
                  >
                    Wyjaśnij prościej
                  </button>
                ) : null}
              </div>
            ))}
            {busy ? <p>{status}</p> : null}
          </div>
          {suggestions.length ? (
            <div>
              <p className="font-medium">Propozycje</p>
              <ul className="mt-2 space-y-2">
                {suggestions.map((item) => (
                  <li key={item}>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-auto min-h-11 w-full justify-start rounded-xl py-2 text-left whitespace-normal"
                      onClick={() => void send(item)}
                    >
                      {item}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {Object.keys(pending).length ? (
            <p role="status">Uzupełniłem fiszkę. Sprawdź pola po lewej.</p>
          ) : null}
          <form
            className="space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              void send(text);
            }}
          >
            <Label htmlFor="assist-msg">Pytanie do asystenta</Label>
            <Textarea
              id="assist-msg"
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={3}
            />
            <Button type="submit" disabled={busy}>
              {busy ? "Czekam…" : "Wyślij do asystenta"}
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
