"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ResourceNav } from "@/components/resource-nav";

const STEPS = ["Wysłane", "W ocenie", "Decyzja"];

export default function PotwierdzeniePage() {
  const [title, setTitle] = useState<string | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const raw = sessionStorage.getItem("hubmi-last-submission");
        if (!raw) return;
        const parsed = JSON.parse(raw) as { title?: string };
        setTitle(parsed.title ?? "Twoje zgłoszenie");
      } catch {
        setTitle("Twoje zgłoszenie");
      }
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div>
      <ResourceNav current="/kreator" />
      <h1 className="text-3xl font-bold">Gotowe. Zgłoszenie zostało zapisane.</h1>
      <p className="mt-3 max-w-prose">
        {title
          ? `Zapisaliśmy „${title}”. Pracownicy ROPS zobaczą je na liście zgłoszeń.`
          : "Zapisaliśmy zgłoszenie. Pracownicy ROPS zobaczą je na liście zgłoszeń."}
      </p>
      <ol aria-label="Etapy zgłoszenia" className="mt-6 flex flex-wrap gap-2">
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
      <p className="mt-6">
        <Link
          href="/moje-zgloszenia"
          className="inline-flex min-h-11 items-center underline underline-offset-4"
        >
          Moje zgłoszenia
        </Link>
      </p>
    </div>
  );
}
