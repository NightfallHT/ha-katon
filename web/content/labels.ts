export const CATEGORY_LABELS: Record<string, string> = {
  starzenie: "Starzenie się",
  zdrowie_psychiczne: "Zdrowie psychiczne",
  samotnosc: "Samotność",
  wykluczenie_cyfrowe: "Wykluczenie cyfrowe",
  dostep_do_uslug: "Dostęp do usług",
  niepelnosprawnosc: "Niepełnosprawność",
  integracja_spoleczna: "Integracja społeczna",
  rodzina_dzieci: "Rodzina i dzieci",
  wspolpraca_miedzysektorowa: "Współpraca międzysektorowa",
  inne: "Inne",
};

export const STAGE_LABELS: Record<string, string> = {
  pomysł: "Pomysł",
  testowana: "Testowana",
  wdrożona: "Wdrożona",
};

export function categoryLabel(slug: string) {
  return CATEGORY_LABELS[slug] ?? slug;
}

export function stageLabel(stage: string) {
  return STAGE_LABELS[stage] ?? stage;
}

export function slugify(title: string) {
  return title
    .toLowerCase()
    .replaceAll("ł", "l")
    .replaceAll("Ł", "l")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
