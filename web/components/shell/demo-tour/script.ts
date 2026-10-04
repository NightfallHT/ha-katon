/**
 * The recorded walkthrough, as data.
 *
 * Every step says what the viewer reads and what the page does. Durations are
 * the floor, not the ceiling: a step that waits for a selector stays on screen
 * until the page catches up, so a slow model call stretches the step instead of
 * desynchronising the captions from the screen.
 *
 * `PLANNED_MS` below is asserted against 2 minutes by a test, so adding a step
 * forces a conscious trade against the rest.
 */

export type Perspective = "Mieszkaniec" | "Instytucja" | "ROPS";

export type Step = {
  /** Shown in the caption panel. Keep it one sentence a presenter could say. */
  caption: string;
  perspective: Perspective;
  /** Minimum time the caption stays up, in ms. */
  ms: number;
  /** Where this step happens. Omit to stay on the current page. */
  go?: string;
  /** Selector that must already be on the page before the step acts on it. */
  waitFor?: string;
  /** Selector the step's own clicks produce. Waited for after they run. */
  until?: string;
  /** Scroll this into view. */
  scrollTo?: string;
  /** Type into this field, character by character. */
  type?: { selector: string; text: string };
  /** Click these, in order, pausing between them. */
  click?: string[];
  /** Click the first button whose visible text contains this (case-insensitive). */
  clickText?: string[];
  /** Fill instantly (logins — nobody needs to watch a password being typed). */
  fill?: { selector: string; value: string }[];
};

// Selector note: these are the real hooks on the pages, not test ids. If a page
// renames one the tour skips that step rather than hanging — see runner.ts.
export const STEPS: Step[] = [
  {
    caption:
      "Małopolski Hub Innowacji Społecznych — jedno miejsce dla mieszkańców, organizacji i gmin.",
    perspective: "Mieszkaniec",
    ms: 4000,
    go: "/",
    waitFor: "#problem",
  },
  {
    caption:
      "Dostępność nie jest dodatkiem. Rozmiar tekstu i wysoki kontrast przełączasz z każdej strony, a ustawienie zostaje.",
    perspective: "Mieszkaniec",
    ms: 4500,
    click: ['.wcag-panel__font--150', ".wcag-panel__contrast"],
  },
  {
    caption: "Wracamy do widoku domyślnego — te same treści, inny sposób czytania.",
    perspective: "Mieszkaniec",
    ms: 3000,
    click: [".wcag-panel__contrast", '.wcag-panel__font--100'],
  },
  {
    caption:
      "Mieszkaniec opisuje sprawę własnymi słowami. Nie musi znać nazwy programu ani urzędowego języka.",
    perspective: "Mieszkaniec",
    ms: 2000,
    type: {
      selector: "#problem",
      text: "Starsi sąsiedzi są samotni i nie dojadą do lekarza. Mieszkam w wiejskiej gminie.",
    },
  },
  {
    caption:
      "Model wyciąga z tego zdania grupę, temat i miejsce, a potem dopasowuje istniejące innowacje z Małopolski.",
    perspective: "Mieszkaniec",
    ms: 2500,
    click: ['.search-panel button[type="submit"]'],
    until: "h1#wyniki",
  },
  {
    caption:
      "Przy każdym dopasowaniu jest napisane, dlaczego pasuje — a obok materiały do przeczytania.",
    perspective: "Mieszkaniec",
    ms: 4500,
    scrollTo: ".result-title-list",
  },
  {
    caption:
      "Wynik prowadzi do karty rozwiązania: opis, etap, region i kontakt do organizacji, która je prowadzi.",
    perspective: "Mieszkaniec",
    ms: 4000,
    click: [".result-title-list h2 a"],
    until: ".innovation-detail",
  },
  {
    caption:
      "Mieszkaniec może zapisać się do testowania i ocenić rozwiązanie, którego już używał. To zasila oceny w bazie.",
    perspective: "Mieszkaniec",
    ms: 4000,
    scrollTo: ".tester-panel",
  },
  {
    caption:
      "Zasobnik wiedzy odpowiada na pytanie zadane po polsku, a nie hasłem do wyszukiwarki.",
    perspective: "Mieszkaniec",
    ms: 2000,
    go: "/zasobnik",
    waitFor: "#knowledge-query",
    type: {
      selector: "#knowledge-query",
      text: "Co już działa w Małopolsce w wsparciu samotnych seniorów?",
    },
  },
  {
    caption:
      "Raport jest podzielony na sekcje: w skrócie z liczbami, co już działa, innowacje i materiały. Liczby i linki pochodzą z bazy, nie z modelu.",
    perspective: "Mieszkaniec",
    ms: 3000,
    click: ['.search-panel button[type="submit"]'],
    until: "#report-title",
  },
  {
    caption:
      "A kto nie chce pisać, przegląda ten sam zbiór klikając filtry — tematy, etapy, rodzaje materiałów.",
    perspective: "Mieszkaniec",
    ms: 4000,
    scrollTo: ".catalog",
    click: [".catalog__filters input[type=checkbox]"],
  },
  {
    // Middleman asks who you are first, so the tour goes through that gate
    // instead of around it — the viewer sees the same screen a gmina sees.
    caption:
      "Teraz perspektywa gminy. Middleman najpierw pyta, kto wchodzi — mieszkaniec szuka pomocy gdzie indziej.",
    perspective: "Instytucja",
    ms: 3000,
    go: "/middleman",
    clickText: ["Wchodzę jako instytucja"],
    until: "#gmina",
  },
  {
    caption:
      "Pracownik wybiera swoją gminę i innowację, którą chce u siebie uruchomić.",
    perspective: "Instytucja",
    ms: 3000,
    scrollTo: ".middleman-setup",
  },
  {
    caption:
      "Asystent prowadzi rozmowę: dopytuje o grupę, budżet i ludzi, zamiast od razu generować gotowy dokument.",
    perspective: "Instytucja",
    ms: 3000,
    click: [".middleman-picks li button"],
    clickText: ["Rozpocznij rozmowę"],
    until: "#middleman-message",
  },
  {
    caption:
      "Odpowiedź gminy wraca do modelu razem z profilem gminy — liczbą mieszkańców i trendem demograficznym.",
    perspective: "Instytucja",
    ms: 4000,
    type: {
      selector: "#middleman-message",
      text: "Mamy mały budżet i dwie osoby do pracy.",
    },
    click: [".middleman-actions button[type=submit]"],
  },
  {
    caption:
      "Na końcu powstaje projekt lokalnej usługi z warunkami programu — gotowy do rozmowy z radą gminy.",
    perspective: "Instytucja",
    ms: 4500,
    scrollTo: ".middleman-chat",
  },
  {
    caption:
      "Organizacje i gminy składają wnioski o grant. Każdy otwarty nabór ma termin, regulamin i formularz.",
    perspective: "Instytucja",
    ms: 4500,
    go: "/kreator/grant",
    waitFor: ".call-card",
  },
  {
    caption:
      "Wniosek powstaje w czterech krokach: opis pomysłu, szkic sekcji od modelu, budżet z sumą i dane kontaktowe.",
    perspective: "Instytucja",
    ms: 4000,
    go: "/kreator/grant/wniosek",
    waitFor: ".grant-step",
  },
  {
    caption:
      "Pomysł bez naboru też ma gdzie trafić — jeden ekran, pięć pytań, licznik postępu.",
    perspective: "Instytucja",
    ms: 4000,
    go: "/kreator/fiszka",
    waitFor: "#title",
    scrollTo: ".flat-form__layout",
  },
  {
    caption:
      "Trzecia perspektywa: pracownik ROPS. W prototypie jedno wejście pokazowe, bez zakładania kont.",
    perspective: "ROPS",
    ms: 3000,
    go: "/admin",
    waitFor: "#login",
    fill: [
      { selector: "#login", value: "admin" },
      { selector: "#password", value: "admin" },
    ],
  },
  {
    caption:
      "Pulpit pokazuje, co czeka na decyzję: nowe zgłoszenia, sprawy w ocenie, opublikowane innowacje.",
    perspective: "ROPS",
    ms: 4000,
    click: ['.admin-login button[type="submit"]'],
    until: ".admin-dashboard__tiles",
  },
  {
    caption:
      "Wszystkie zgłoszenia w jednej skrzynce — pomysły, dobre praktyki, wnioski i wiadomości, ze statusem przy każdym.",
    perspective: "ROPS",
    ms: 4500,
    go: "/admin/zgloszenia",
    waitFor: ".admin-table",
  },
  {
    caption:
      "W zgłoszeniu model proponuje streszczenie i kategorię, ale decyzję podejmuje człowiek — i odpowiada autorowi.",
    perspective: "ROPS",
    ms: 4000,
    click: [".admin-table tbody th a"],
    until: ".admin-meta",
    scrollTo: ".admin-card",
  },
  {
    caption:
      "Zapis włącza się dopiero, gdy wszystkie pola są wypełnione i coś faktycznie się zmieniło. Obok jest napisane, czego brakuje.",
    perspective: "ROPS",
    ms: 4500,
    scrollTo: ".admin-save",
  },
  {
    caption:
      "Trendy zapytań: czego mieszkańcy szukali w tym tygodniu. To materiał do planowania naborów, a nie tylko statystyka.",
    perspective: "ROPS",
    ms: 4000,
    go: "/admin/trendy",
    waitFor: ".admin-stats",
    scrollTo: ".admin-card",
  },
  {
    caption:
      "I pełna edycja każdej tabeli w bazie — innowacje, nabory, wyzwania, oceny — bez pisania SQL.",
    perspective: "ROPS",
    ms: 4500,
    go: "/admin/dane",
    waitFor: ".feature-grid",
  },
  {
    caption:
      "Mieszkaniec znajduje pomoc, gmina zamienia pomysł w usługę, ROPS widzi całość i decyduje. Jedna platforma, trzy perspektywy.",
    perspective: "Mieszkaniec",
    ms: 4500,
    go: "/",
    waitFor: "#problem",
  },
];

/** Sum of the minimum durations. The real run is longer by whatever the page waits for. */
export const PLANNED_MS = STEPS.reduce((total, step) => total + step.ms, 0);
