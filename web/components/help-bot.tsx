"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Source = { title: string; url: string };
type Msg = { role: "user" | "assistant"; content: string; sources?: Source[]; handoff?: boolean };

const AI_URL = process.env.NEXT_PUBLIC_AI_URL;

// Floating help bot. Add <HelpBot /> once in app/layout.tsx.
export function HelpBot() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, busy]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const message = text.trim();
    if (!message || busy) return;
    const history = messages.map(({ role, content }) => ({ role, content }));
    setMessages((m) => [...m, { role: "user", content: message }]);
    setText("");
    setBusy(true);
    setStatus("Szukam odpowiedzi…");
    try {
      if (!AI_URL) throw new Error("no ai url");
      const res = await fetch(`${AI_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history, page: pathname }),
      });
      if (!res.ok) throw new Error("bad status");
      const data = (await res.json()) as { reply: string; sources?: Source[]; handoff?: boolean };
      setMessages((m) => [...m, { role: "assistant", content: data.reply, sources: data.sources ?? [], handoff: data.handoff }]);
      setStatus("");
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Nie mogę teraz odpowiedzieć. Możesz napisać do pracownika ROPS.", handoff: true },
      ]);
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const handoffHref = `/kontakt?message=${encodeURIComponent(lastUser)}&page=${encodeURIComponent(pathname ?? "")}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="fixed bottom-4 right-4 z-40 min-h-11 rounded-full border bg-background px-5 py-3 font-semibold shadow-lg focus-visible:ring-2 focus-visible:ring-ring"
        >
          Potrzebujesz pomocy?
        </button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[85vh] flex-col gap-3 sm:max-w-lg">
        <DialogTitle>Pomoc</DialogTitle>
        <DialogDescription>Zadaj pytanie o platformę. Odpowiada asystent AI.</DialogDescription>

        <div role="log" aria-live="polite" aria-label="Rozmowa z asystentem" className="min-h-40 flex-1 space-y-3 overflow-y-auto">
          {messages.length === 0 && <p>Napisz, w czym możemy pomóc.</p>}
          {messages.map((m, i) => (
            <div key={i} className="rounded-md border p-3">
              <p className="font-medium">{m.role === "user" ? "Ty" : "Asystent"}</p>
              <p className="whitespace-pre-wrap">{m.content}</p>
              {m.sources && m.sources.length > 0 && (
                <ul className="mt-2 list-disc pl-5">
                  {m.sources.map((s) => (
                    <li key={s.url}>
                      <a href={s.url} className="underline">{s.title}</a>
                    </li>
                  ))}
                </ul>
              )}
              {m.handoff && (
                <p className="mt-2">
                  <Link href={handoffHref} onClick={() => setOpen(false)} className="inline-flex min-h-11 items-center underline">
                    Napisz do pracownika ROPS
                  </Link>
                </p>
              )}
            </div>
          ))}
          {busy && <p>{status}</p>}
          <div ref={endRef} />
        </div>

        <form onSubmit={send} className="space-y-2">
          <label htmlFor="bot-input" className="block font-medium">Twoje pytanie</label>
          <textarea
            id="bot-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            className="w-full rounded-md border p-3"
          />
          <button
            type="submit"
            disabled={busy}
            className="min-h-11 rounded-md border px-4 py-2 font-medium focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          >
            Wyślij
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
