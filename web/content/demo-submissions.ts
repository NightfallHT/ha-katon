export type DemoSubmission = {
  id: string;
  type: string;
  title: string;
  author_name: string;
  author_email: string;
  author_role: string;
  status: string;
  created_at: string;
  payload: Record<string, unknown>;
  ai_summary: string;
  ai_category: string;
  ai_tags: string[];
  innovation_id: string | null;
  demo: true;
};

export type DemoMessage = {
  id: string;
  submission_id: string;
  sender: "admin" | "author";
  body: string;
  created_at: string;
};

export const DEMO_SUBMISSIONS: DemoSubmission[] = [
  {
    id: "11111111-1111-4111-a111-111111111111",
    type: "idea",
    title: "Sąsiedzki bus do przychodni",
    author_name: "Anna K.",
    author_email: "anna.k@razem-blizej.demo",
    author_role: "ngo",
    status: "nowe",
    created_at: "2026-10-03T10:00:00.000Z",
    payload: {
      problem: "Starsi sąsiedzi są sami i nie dojadą do lekarza.",
      solution: "Sąsiedzki bus dwa razy w tygodniu i dyżur przy zapisach.",
      target_group: "seniorzy w gminie wiejskiej",
      stage: "pomysł",
      location: "gmina wiejska, Małopolska",
    },
    ai_summary: "Pomysł na wspólny dojazd seniorów do przychodni w małej gminie.",
    ai_category: "samotnosc",
    ai_tags: ["transport", "seniorzy"],
    innovation_id: null,
    demo: true,
  },
  {
    id: "22222222-2222-4222-a222-222222222222",
    type: "grant_application",
    title: "Wniosek: Mikrogranty 2026",
    author_name: "Anna K.",
    author_email: "anna.k@razem-blizej.demo",
    author_role: "ngo",
    status: "w_ocenie",
    created_at: "2026-10-03T11:00:00.000Z",
    payload: {
      sections: {
        cel: "Zmniejszyć samotność i ułatwić dojazd do lekarza.",
        grupa_docelowa: "Seniorzy w gminie wiejskiej.",
      },
      accepted_regulamin: true,
    },
    ai_summary: "Wniosek o mikrogrant na sąsiedzki bus.",
    ai_category: "dostep_do_uslug",
    ai_tags: ["grant", "transport"],
    innovation_id: null,
    demo: true,
  },
  {
    id: "33333333-3333-4333-a333-333333333333",
    type: "test_signup",
    title: "Zapis do testów: sąsiedzki bus",
    author_name: "Halina",
    author_email: "halina@demo.hubmi.pl",
    author_role: "mieszkaniec",
    status: "nowe",
    created_at: "2026-10-03T12:00:00.000Z",
    payload: {
      motivation: "Słabo widzę. Chcę sprawdzić, czy same dojadę na wizytę.",
    },
    ai_summary: "Mieszkanka zgłasza się do testu rozwiązania transportowego.",
    ai_category: "niepelnosprawnosc",
    ai_tags: ["test"],
    innovation_id: null,
    demo: true,
  },
];

export const DEMO_MESSAGES: DemoMessage[] = [
  {
    id: "m-1",
    submission_id: "22222222-2222-4222-a222-222222222222",
    sender: "admin",
    body: "Dziękujemy. Sprawdzamy wniosek pod kątem regulaminu mikrograntów.",
    created_at: "2026-10-03T13:00:00.000Z",
  },
];

export function demoSubmissionById(id: string) {
  return DEMO_SUBMISSIONS.find((item) => item.id === id) ?? null;
}

export function demoMessagesFor(id: string) {
  return DEMO_MESSAGES.filter((item) => item.submission_id === id);
}
