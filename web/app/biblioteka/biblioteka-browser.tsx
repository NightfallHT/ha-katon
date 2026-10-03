"use client";

import { useMemo, useState } from "react";
import { InnovationCard } from "@/components/innovation-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Innovation } from "@/content/catalog";
import { categoryLabel, stageLabel } from "@/content/labels";

const STAGES = ["pomysł", "testowana", "wdrożona"];

const SHORTCUTS = [
  { label: "Dla mnie — niepełnosprawność", category: "niepelnosprawnosc" },
  { label: "Seniorzy", category: "starzenie" },
  { label: "Samotność", category: "samotnosc" },
];

export function BibliotekaBrowser({
  items,
  initialCategory,
}: {
  items: Innovation[];
  initialCategory?: string;
}) {
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<string[]>(
    initialCategory ? [initialCategory] : [],
  );
  const [groups, setGroups] = useState<string[]>([]);
  const [stages, setStages] = useState<string[]>([]);

  const allCategories = useMemo(
    () => Array.from(new Set(items.map((item) => item.category))).sort(),
    [items],
  );
  const allGroups = useMemo(
    () =>
      Array.from(new Set(items.flatMap((item) => item.target_groups))).sort(),
    [items],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (categories.length && !categories.includes(item.category)) return false;
      if (stages.length && !stages.includes(item.stage)) return false;
      if (groups.length && !groups.some((g) => item.target_groups.includes(g)))
        return false;
      if (!q) return true;
      const hay = [
        item.title,
        item.summary,
        item.description,
        ...item.tags,
        ...item.target_groups,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [items, query, categories, groups, stages]);

  function toggle(list: string[], value: string, set: (next: string[]) => void) {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
      <form
        className="space-y-6"
        onSubmit={(event) => event.preventDefault()}
        aria-label="Filtry biblioteki"
      >
        <div className="space-y-2">
          <Label htmlFor="szukaj">Czego szukasz?</Label>
          <Input
            id="szukaj"
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Wpisz temat lub potrzebę"
          />
        </div>

        <p className="flex flex-col gap-2">
          {SHORTCUTS.map((item) => (
            <button
              key={item.category}
              type="button"
              className={`inline-flex min-h-11 items-center justify-center rounded-full border px-4 text-left font-medium ${
                categories.includes(item.category)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border"
              }`}
              aria-pressed={categories.includes(item.category)}
              onClick={() => setCategories([item.category])}
            >
              {item.label}
            </button>
          ))}
        </p>

        <fieldset className="space-y-2">
          <legend className="font-medium">Temat</legend>
          {allCategories.map((slug) => (
            <label key={slug} className="flex min-h-11 items-center gap-2">
              <input
                type="checkbox"
                className="size-5"
                checked={categories.includes(slug)}
                onChange={() => toggle(categories, slug, setCategories)}
              />
              {categoryLabel(slug)}
            </label>
          ))}
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="font-medium">Dla kogo</legend>
          {allGroups.map((group) => (
            <label key={group} className="flex min-h-11 items-center gap-2">
              <input
                type="checkbox"
                className="size-5"
                checked={groups.includes(group)}
                onChange={() => toggle(groups, group, setGroups)}
              />
              {group}
            </label>
          ))}
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="font-medium">Etap</legend>
          {STAGES.map((stage) => (
            <label key={stage} className="flex min-h-11 items-center gap-2">
              <input
                type="checkbox"
                className="size-5"
                checked={stages.includes(stage)}
                onChange={() => toggle(stages, stage, setStages)}
              />
              {stageLabel(stage)}
            </label>
          ))}
        </fieldset>
      </form>

      <div>
        <p className="mb-4" aria-live="polite">
          {filtered.length === 1
            ? "Znaleziono 1 rozwiązanie."
            : `Znaleziono ${filtered.length} rozwiązań.`}
        </p>
        {filtered.length === 0 ? (
          <p>Nie ma rozwiązań z takimi filtrami. Zmień filtry albo wpisz inne słowo.</p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {filtered.map((item) => (
              <li key={item.id}>
                <InnovationCard innovation={item} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
