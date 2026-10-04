export type Role = "mieszkaniec" | "ngo" | "gmina" | "ekspert" | "admin";

export type InnovationRow = {
  id: string;
  title: string;
  summary: string;
  description: string | null;
  category: string;
  target_groups: string[];
  tags: string[];
  stage: string | null;
  region: string | null;
  video_url: string | null;
  image_url: string | null;
  image_alt: string | null;
  source_url: string | null;
  contact_org: string | null;
  avg_rating: number;
  ratings_count: number;
  published: boolean;
  created_at: string;
};

export type GminaRow = {
  id?: string;
  name: string;
  powiat: string;
  type: string;
  population: number;
  population_trend: string;
};

export type ChatTurn = { role: "user" | "assistant"; content: string };

export type Fiszka = {
  title: string;
  problem: string;
  solution: string;
  target_group: string;
  stage: string;
};

export type MatchResult = {
  innovation_id: string;
  title: string;
  summary: string;
  category: string;
  score: number;
  why: string;
};

export type MatchResponse = {
  need_id: string;
  extracted: {
    category: string;
    target_group: string;
    location: string | null;
    keywords: string[];
  };
  results: MatchResult[];
  similar_needs: { count: number; example: string | null };
};

export type SimplifyResponse = { text: string };

export type KreatorAssistResponse = {
  reply: string;
  suggestions: string[];
  updated_fields: Partial<Fiszka>;
};

export type GrantDraftResponse = {
  sections: {
    cel: string;
    grupa_docelowa: string;
    dzialania: string;
    rezultaty: string;
  };
  budget: { item: string; category: string; amount: number }[];
};

export type MiddlemanChatResponse = { reply: string; done: boolean; suggestions?: string[] };

export type MiddlemanReport = {
  service_name: string;
  summary: string;
  root_causes: string[];
  service_description: string;
  delivery_partners: string[];
  staffing: string;
  cost_estimate: { item: string; amount_pln_per_year: number }[];
  kpis: string[];
  risks: string[];
  usluga_wrazliwa_checklist: { item: string; done: boolean; answer?: string }[];
};

export type ChatResponse = {
  reply: string;
  sources: { title: string; url: string }[];
  handoff: boolean;
};

export type KnowledgeReport = {
  title: string;
  summary: string;
  metrics: { value: string; label: string }[];
  what_works: string[];
  innovations: { innovation_id: string; title: string; summary: string }[];
  materials: { title: string; url: string; description: string }[];
};

export type EnrichResponse = {
  summary: string;
  tags: string[];
  category: string;
};
