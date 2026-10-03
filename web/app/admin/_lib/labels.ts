// Polish labels for values stored in the database (AGENTS.md section 5).
export const TYPE_LABELS: Record<string, string> = {
  idea: "Pomysł",
  good_practice: "Dobra praktyka",
  grant_application: "Wniosek grantowy",
  contact: "Wiadomość",
  test_signup: "Zapis do testów",
};

export const STATUS_LABELS: Record<string, string> = {
  nowe: "Nowe",
  w_ocenie: "W ocenie",
  zaakceptowane: "Zaakceptowane",
  odrzucone: "Odrzucone",
};

export const PAYLOAD_LABELS: Record<string, string> = {
  problem: "Problem",
  solution: "Rozwiązanie",
  target_group: "Grupa docelowa",
  stage: "Etap",
  location: "Lokalizacja",
  message: "Wiadomość",
  page: "Strona",
  innovation_id: "Identyfikator innowacji",
  motivation: "Motywacja",
  accepted_regulamin: "Regulamin zaakceptowany",
  fiszka: "Fiszka",
  sections: "Sekcje wniosku",
  budget: "Budżet",
};

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

export const label = (map: Record<string, string>, key: string | null | undefined) =>
  (key && map[key]) || key || "—";

export function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Warsaw" }).format(new Date(iso));
}
