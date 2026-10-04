"use client";

import { useEffect, useState } from "react";

const STEPS = ["Wysłane", "W ocenie", "Decyzja"];

type Stored = { title?: string; type?: string };

// Shows the last submission saved in this browser while it is not yet in the list
// from the database. Once listed there, the list shows its real status instead.
export function LocalLastSubmission({ listedTitles = [] }: { listedTitles?: string[] }) {
  const [item, setItem] = useState<Stored | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const raw = sessionStorage.getItem("hubmi-last-submission");
        if (!raw) return;
        setItem(JSON.parse(raw) as Stored);
      } catch {
        /* ignore */
      }
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!item?.title || listedTitles.includes(item.title)) return null;

  return (
    <aside className="mt-8 rounded-2xl border p-5" aria-label="Ostatnie zgłoszenie na tym komputerze">
      <h2 className="text-xl font-semibold">{item.title}</h2>
      <p className="mt-1">Zapisane na tym komputerze. ROPS widzi je w panelu, gdy baza działa.</p>
      <ol aria-label="Etapy zgłoszenia" className="mt-4 flex flex-wrap gap-2">
        {STEPS.map((label, index) => (
          <li
            key={label}
            aria-current={index === 0 ? "step" : undefined}
            className={`rounded-md border px-3 py-2 ${index === 0 ? "bg-foreground font-semibold text-background" : ""}`}
          >
            {index + 1}. {label}
            {index === 0 ? <span className="sr-only"> (obecny etap)</span> : null}
          </li>
        ))}
      </ol>
    </aside>
  );
}
