"use client";

import { useMemo, useState } from "react";
import { ResourceNav } from "@/components/resource-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { materials } from "@/content/catalog";

const TYPE_LABEL: Record<string, string> = {
  raport: "Raport",
  poradnik: "Poradnik",
  film: "Film",
  canvas: "Canvas",
};

const TYPES = [
  { value: "all", label: "Wszystkie" },
  { value: "raport", label: "Raport" },
  { value: "poradnik", label: "Poradnik" },
  { value: "film", label: "Film" },
  { value: "canvas", label: "Canvas" },
];

export default function MaterialyPage() {
  const [type, setType] = useState("all");
  const filtered = useMemo(
    () => (type === "all" ? materials : materials.filter((item) => item.type === type)),
    [type],
  );

  return (
    <div>
      <ResourceNav current="/materialy" />
      <h1 className="text-3xl font-bold">Materiały do pobrania</h1>
      <p className="mt-3 max-w-prose">
        Raporty, poradniki i narzędzia, które pomagają opisać pomysł.
      </p>

      <fieldset className="mt-6">
        <legend className="mb-2 font-medium">Rodzaj materiału</legend>
        <div className="flex flex-wrap gap-3">
          {TYPES.map((item) => (
            <label key={item.value} className="flex min-h-11 items-center gap-2">
              <input
                type="radio"
                name="typ"
                className="size-5"
                checked={type === item.value}
                onChange={() => setType(item.value)}
              />
              {item.label}
            </label>
          ))}
        </div>
      </fieldset>

      <p className="mt-4" aria-live="polite">
        Liczba materiałów: {filtered.length}.
      </p>

      <ul className="mt-6 grid gap-4">
        {filtered.map((item) => (
          <li key={item.title}>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>Rodzaj: {TYPE_LABEL[item.type] ?? item.type}</p>
                <p>{item.description}</p>
                <p>
                  <a
                    className="inline-flex min-h-11 items-center underline underline-offset-4"
                    href={item.url}
                    rel="noreferrer"
                  >
                    Otwórz materiał
                  </a>
                </p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
