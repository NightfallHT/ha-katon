import { CATEGORY_LABELS } from "@/content/labels";

export const CATEGORIES = CATEGORY_LABELS;

export const CATEGORY_ICONS: Record<string, string> = {
  starzenie: "person-standing",
  zdrowie_psychiczne: "heart",
  samotnosc: "users",
  wykluczenie_cyfrowe: "laptop",
  dostep_do_uslug: "bus",
  niepelnosprawnosc: "accessibility",
  integracja_spoleczna: "handshake",
  rodzina_dzieci: "baby",
  wspolpraca_miedzysektorowa: "building-2",
  inne: "circle",
};

export function categoryLabel(slug: string) {
  return CATEGORIES[slug] ?? slug;
}
