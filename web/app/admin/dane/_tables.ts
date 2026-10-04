/**
 * Declarative description of every table in db/schema.sql, so the admin panel
 * can browse and edit all of them from one generic page instead of a bespoke
 * screen per table.
 *
 * Keep in sync with db/schema.sql (owner: Ola). Adding a column here is all
 * that is needed for it to show up in the editor.
 */

export type FieldKind =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "date"
  | "list" // text[] edited as one comma-separated line
  | "json"
  | "readonly";

export type Field = {
  name: string;
  /** Short column name — this is what the list view puts in the table header. */
  label: string;
  /** Format rule or allowed values. Shown under the label on the edit form only. */
  hint?: string;
  kind: FieldKind;
};

export type TableDef = {
  /** Postgres table name. */
  name: string;
  label: string;
  description: string;
  glyph: string;
  /** Column shown as the row title in lists. */
  titleField: string;
  /** Columns offered as extra list columns. */
  listFields: string[];
  /** Columns matched by the search box (text columns only). */
  searchFields: string[];
  /** Column used for ordering, newest first when it exists. */
  orderBy?: string;
  fields: Field[];
  /** False for tables where creating a row by hand makes no sense. */
  canCreate: boolean;
};

const COMMA_HINT = "Kilka wartości rozdziel przecinkami.";

const CATEGORY_HINT =
  "Slug z listy: starzenie, zdrowie_psychiczne, samotnosc, wykluczenie_cyfrowe, dostep_do_uslug, niepelnosprawnosc, integracja_spoleczna, rodzina_dzieci, wspolpraca_miedzysektorowa, inne";

export const TABLES: TableDef[] = [
  {
    name: "innovations",
    label: "Innowacje",
    description: "Baza rozwiązań pokazywana w wyszukiwaniu i w bazie wiedzy.",
    glyph: "💡",
    titleField: "title",
    listFields: ["category", "stage", "published"],
    searchFields: ["title", "summary", "description"],
    orderBy: "created_at",
    canCreate: true,
    fields: [
      { name: "title", label: "Tytuł", kind: "text" },
      { name: "summary", label: "Streszczenie", hint: "1–2 zdania.", kind: "textarea" },
      { name: "description", label: "Opis", kind: "textarea" },
      { name: "category", label: "Kategoria", hint: CATEGORY_HINT, kind: "text" },
      { name: "target_groups", label: "Grupy docelowe", hint: COMMA_HINT, kind: "list" },
      { name: "tags", label: "Tagi", hint: COMMA_HINT, kind: "list" },
      { name: "stage", label: "Etap", hint: "Jedna z wartości: pomysł, testowana, wdrożona.", kind: "text" },
      { name: "region", label: "Region", kind: "text" },
      { name: "video_url", label: "Link do filmu", kind: "text" },
      { name: "image_url", label: "Link do obrazka", kind: "text" },
      { name: "image_alt", label: "Opis obrazka", hint: "Tekst alternatywny czytany przez czytnik ekranu.", kind: "text" },
      { name: "source_url", label: "Źródło", kind: "text" },
      { name: "contact_org", label: "Organizacja kontaktowa", kind: "text" },
      { name: "avg_rating", label: "Średnia ocena", kind: "number" },
      { name: "ratings_count", label: "Liczba ocen", kind: "number" },
      { name: "published", label: "Opublikowana", kind: "boolean" },
      { name: "created_at", label: "Dodano", kind: "readonly" },
    ],
  },
  {
    name: "challenges",
    label: "Wyzwania",
    description: "Mapa Wyzwań Małopolski — wskaźniki używane w raportach.",
    glyph: "📊",
    titleField: "title",
    listFields: ["category", "powiat", "indicator_value"],
    searchFields: ["title", "description", "powiat"],
    canCreate: true,
    fields: [
      { name: "title", label: "Tytuł", kind: "text" },
      { name: "description", label: "Opis", kind: "textarea" },
      { name: "category", label: "Kategoria", hint: CATEGORY_HINT, kind: "text" },
      { name: "powiat", label: "Powiat", kind: "text" },
      { name: "indicator_name", label: "Nazwa wskaźnika", kind: "text" },
      { name: "indicator_value", label: "Wartość wskaźnika", kind: "number" },
      { name: "source", label: "Źródło", kind: "text" },
    ],
  },
  {
    name: "materials",
    label: "Materiały",
    description: "Raporty, poradniki, filmy i canvasy linkowane w raportach.",
    glyph: "📚",
    titleField: "title",
    listFields: ["type", "url"],
    searchFields: ["title", "description"],
    canCreate: true,
    fields: [
      { name: "title", label: "Tytuł", kind: "text" },
      { name: "type", label: "Typ", hint: "Jedna z wartości: raport, poradnik, film, canvas.", kind: "text" },
      { name: "url", label: "Link", kind: "text" },
      { name: "description", label: "Opis", kind: "textarea" },
      { name: "tags", label: "Tagi", hint: COMMA_HINT, kind: "list" },
    ],
  },
  {
    name: "calls",
    label: "Nabory",
    description: "Nabory grantowe. Pole „Otwarty” decyduje o widoczności wniosku.",
    glyph: "📝",
    titleField: "name",
    listFields: ["is_open", "deadline", "budget_max"],
    searchFields: ["name", "description"],
    canCreate: true,
    fields: [
      { name: "name", label: "Nazwa naboru", kind: "text" },
      { name: "description", label: "Opis", kind: "textarea" },
      { name: "is_open", label: "Otwarty", kind: "boolean" },
      { name: "deadline", label: "Termin", kind: "date" },
      { name: "budget_max", label: "Maksymalny budżet", hint: "Kwota w złotych, bez spacji.", kind: "number" },
      { name: "regulamin_url", label: "Link do regulaminu", kind: "text" },
    ],
  },
  {
    name: "submissions",
    label: "Zgłoszenia",
    description: "Pomysły, dobre praktyki, wnioski, kontakt i zapisy na testy.",
    glyph: "📥",
    titleField: "title",
    listFields: ["type", "status", "author_email"],
    searchFields: ["title", "author_email", "author_name"],
    orderBy: "created_at",
    canCreate: false,
    fields: [
      { name: "title", label: "Tytuł", kind: "text" },
      { name: "type", label: "Typ", kind: "text" },
      { name: "status", label: "Status", hint: "Jedna z wartości: nowe, w_ocenie, zaakceptowane, odrzucone.", kind: "text" },
      { name: "author_name", label: "Autor", kind: "text" },
      { name: "author_email", label: "E-mail autora", kind: "text" },
      { name: "author_role", label: "Rola autora", kind: "text" },
      { name: "ai_summary", label: "Streszczenie AI", kind: "textarea" },
      { name: "ai_tags", label: "Tagi AI", hint: COMMA_HINT, kind: "list" },
      { name: "ai_category", label: "Kategoria AI", kind: "text" },
      { name: "payload", label: "Dane zgłoszenia", hint: "Format JSON.", kind: "json" },
      { name: "created_at", label: "Wysłano", kind: "readonly" },
    ],
  },
  {
    name: "messages",
    label: "Wiadomości",
    description: "Wątek ROPS ↔ autor przy każdym zgłoszeniu.",
    glyph: "💬",
    titleField: "body",
    listFields: ["sender", "created_at"],
    searchFields: ["body"],
    orderBy: "created_at",
    canCreate: false,
    fields: [
      { name: "sender", label: "Nadawca", hint: "Jedna z wartości: admin, author.", kind: "text" },
      { name: "body", label: "Treść", kind: "textarea" },
      { name: "submission_id", label: "Id zgłoszenia", kind: "readonly" },
      { name: "created_at", label: "Wysłano", kind: "readonly" },
    ],
  },
  {
    name: "reviews",
    label: "Oceny",
    description: "Oceny i uwagi od osób testujących innowacje.",
    glyph: "⭐",
    titleField: "feedback",
    listFields: ["rating", "author_email", "created_at"],
    searchFields: ["feedback", "improvement", "author_email"],
    orderBy: "created_at",
    canCreate: false,
    fields: [
      { name: "rating", label: "Ocena", hint: "Liczba od 1 do 5.", kind: "number" },
      { name: "feedback", label: "Opinia", kind: "textarea" },
      { name: "improvement", label: "Co poprawić", kind: "textarea" },
      { name: "author_email", label: "E-mail", kind: "text" },
      { name: "innovation_id", label: "Id innowacji", kind: "readonly" },
      { name: "created_at", label: "Dodano", kind: "readonly" },
    ],
  },
  {
    name: "needs",
    label: "Zapytania",
    description: "Każde wyszukiwanie z wyszukiwarki. Zasila trendy.",
    glyph: "🔍",
    titleField: "text",
    listFields: ["category", "location", "created_at"],
    searchFields: ["text", "category", "location"],
    orderBy: "created_at",
    canCreate: false,
    fields: [
      { name: "text", label: "Treść zapytania", kind: "textarea" },
      { name: "category", label: "Kategoria", kind: "text" },
      { name: "target_group", label: "Grupa docelowa", kind: "text" },
      { name: "location", label: "Lokalizacja", kind: "text" },
      { name: "keywords", label: "Słowa kluczowe", hint: COMMA_HINT, kind: "list" },
      { name: "role", label: "Rola", kind: "text" },
      { name: "created_at", label: "Kiedy", kind: "readonly" },
    ],
  },
  {
    name: "gminas",
    label: "Gminy",
    description: "Profile gmin używane przez Middleman. Tylko dane publiczne.",
    glyph: "🏛️",
    titleField: "name",
    listFields: ["powiat", "type", "population"],
    searchFields: ["name", "powiat"],
    canCreate: true,
    fields: [
      { name: "name", label: "Nazwa", kind: "text" },
      { name: "powiat", label: "Powiat", kind: "text" },
      { name: "type", label: "Typ", hint: "Jedna z wartości: miejska, wiejska, miejsko-wiejska.", kind: "text" },
      { name: "population", label: "Liczba mieszkańców", kind: "number" },
      { name: "population_trend", label: "Trend", hint: "Jedna z wartości: spada, stabilna, rośnie.", kind: "text" },
    ],
  },
];

export function getTable(name: string) {
  return TABLES.find((table) => table.name === name);
}

/** Columns to SELECT for a table: id plus every declared field. */
export function selectList(table: TableDef) {
  return ["id", ...table.fields.map((field) => field.name)].join(",");
}
