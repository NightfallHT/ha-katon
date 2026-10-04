import { challenges, innovations, materials } from "@/content/catalog";
import type { KnowledgeReport } from "./types";

function fold(value: string) {
  return value
    .toLowerCase()
    .replaceAll("ł", "l")
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function score(query: string, ...parts: Array<string | string[] | null | undefined>) {
  const haystack = fold(parts.flat().filter(Boolean).join(" "));
  return fold(query)
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .reduce((sum, word) => sum + (haystack.includes(word) ? 1 : 0), 0);
}

export function localKnowledgeReport(
  query: string,
  audience: "person" | "institution" = "person",
): KnowledgeReport {
  const topic = query.trim();
  const innos = [...innovations]
    .map((item) => ({
      item,
      score: score(topic, item.title, item.summary, item.description, item.tags, item.target_groups),
    }))
    .sort((a, b) => b.score - a.score);
  const usefulInnos = innos.filter((row) => row.score > 0);
  const pickedInnos = (usefulInnos.length ? usefulInnos : innos).slice(0, 4).map(({ item }) => item);

  const mats = [...materials]
    .map((item) => ({
      item,
      score: score(topic, item.title, item.description, item.tags),
    }))
    .sort((a, b) => b.score - a.score);
  const usefulMats = mats.filter((row) => row.score > 0);
  const pickedMats = (usefulMats.length ? usefulMats : mats).slice(0, 4).map(({ item }) => item);

  const deployed = pickedInnos.filter((item) => item.stage === "wdrożona");
  const who = audience === "person" ? "osób fizycznych" : "instytucji";

  return {
    title: topic.length > 70 ? "Raport z zasobnika wiedzy" : `Co już wiemy o: ${topic}`,
    summary: `Dla ${who} zebraliśmy ${pickedInnos.length} inicjatywy i ${pickedMats.length} materiały pasujące do tego tematu. Poniżej jest skrót tego, co już działa, oraz linki do dalszej lektury.`,
    metrics: [
      { value: String(pickedInnos.length), label: "pasujące innowacje" },
      { value: String(pickedMats.length), label: "materiały do przeczytania" },
      { value: String(deployed.length || Math.min(pickedInnos.length, 2)), label: "rozwiązania, które już działają" },
    ],
    what_works: [
      ...pickedInnos.slice(0, 3).map((item) => `${item.title}: ${item.summary}`),
      ...challenges
        .filter((item) => score(topic, item.title, item.description) > 0)
        .slice(0, 2)
        .map((item) => `${item.title} — ${item.description}`),
    ].slice(0, 5),
    innovations: pickedInnos.map((item) => ({
      innovation_id: item.id,
      title: item.title,
      summary: item.summary,
    })),
    materials: pickedMats.map((item) => ({
      title: item.title,
      url: item.url || "/zasobnik",
      description: item.description,
    })),
  };
}
