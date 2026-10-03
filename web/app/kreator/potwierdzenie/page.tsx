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
          ? `Zapisaliśmy „${title}” na tym komputerze, żeby pokazać ścieżkę demo.`
          : "Zapisaliśmy zgłoszenie na tym komputerze, żeby pokazać ścieżkę demo."}{" "}
        Jakub podłączy wysyłkę do panelu ROPS.
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
