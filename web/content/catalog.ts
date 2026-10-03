import challengesJson from "./seed/challenges.json";
import callsJson from "./seed/calls.json";
import innovationsJson from "./seed/innovations.json";
import materialsJson from "./seed/materials.json";
import { slugify } from "./labels";

export type Innovation = {
  id: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  target_groups: string[];
  tags: string[];
  stage: string;
  region: string | null;
  video_url: string | null;
  image_url: string | null;
  image_alt: string;
  source_url: string | null;
  contact_org: string | null;
  avg_rating: number;
  ratings_count: number;
};

export type Challenge = {
  title: string;
  description: string;
  category: string;
  powiat: string;
  indicator_name: string;
  indicator_value: number;
  source: string;
};

export type Material = {
  title: string;
  type: string;
  url: string;
  description: string;
  tags: string[];
};

export type Call = {
  name: string;
  description: string;
  is_open: boolean;
  deadline: string;
  budget_max: number;
  regulamin_url: string;
};

const used = new Set<string>();

function uniqueId(title: string) {
  const base = slugify(title) || "innowacja";
  let id = base;
  let n = 2;
  while (used.has(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  used.add(id);
  return id;
}

export const innovations: Innovation[] = (
  innovationsJson as Omit<Innovation, "id" | "avg_rating" | "ratings_count">[]
).map((item) => ({
  ...item,
  id: uniqueId(item.title),
  avg_rating: 0,
  ratings_count: 0,
}));

export const challenges = challengesJson as Challenge[];
export const materials = materialsJson as Material[];
export const calls = callsJson as Call[];

export function getInnovation(id: string) {
  return innovations.find((item) => item.id === id);
}

export function similarInnovations(item: Innovation, limit = 3) {
  return innovations
    .filter((other) => other.id !== item.id && other.category === item.category)
    .slice(0, limit);
}
