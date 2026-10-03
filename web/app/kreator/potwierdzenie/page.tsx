"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ResourceNav } from "@/components/resource-nav";

export default function PotwierdzeniePage() {
  const [title, setTitle] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("hubmi-last-submission");
      if (!raw) return;
      const parsed = JSON.parse(raw) as { title?: string };
      setTitle(parsed.title ?? "Twoje zgłoszenie");
    } catch {
      setTitle("Twoje zgłoszenie");
    }
  }, []);

  return (
    <div>
      <ResourceNav current="/kreator" />
      <h1 className="text-3xl font-bold">Gotowe. Zgłoszenie zostało zapisane.</h1>
      <p className="mt-3 max-w-prose">
        {title
          ? `Zapisaliśmy „${title}”. Pracownicy ROPS zobaczą je na liście zgłoszeń.`
          : "Zapisaliśmy zgłoszenie. Pracownicy ROPS zobaczą je na liście zgłoszeń."}{" "}
        Status możesz śledzić w „Moich zgłoszeniach”.
      </p>
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
