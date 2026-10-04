import { innovations } from "@/content/catalog";
import type { MatchResponse } from "./types";

const DEMOS: { needles: string[]; response: MatchResponse }[] = [
  {
    needles: ["słabo widzę", "slabo widze"],
    response: {
      need_id: "22222222-2222-4222-8222-222222222201",
      extracted: {
        category: "niepelnosprawnosc",
        target_group: "osoby słabowidzące",
        location: "Małopolska",
        keywords: ["słabo widzę", "innowacje", "Małopolska"],
      },
      results: [
        {
          innovation_id: "seed",
          title: "Zdobądź swoje szczyty",
          summary:
            "Multimedialny przewodnik opisuje górskie trasy pod kątem różnych potrzeb. Pokazuje przeszkody, nachylenia i dostępne udogodnienia.",
          category: "niepelnosprawnosc",
          score: 0.86,
          why: "To pasuje, bo piszesz, że słabo widzisz: przewodnik ma też audiodeskrypcję i opis barier.",
        },
        {
          innovation_id: "seed",
          title: "Zakupy bez barier",
          summary:
            "Klient może dyskretnie poprosić przeszkolonego pracownika sklepu o pomoc. Wsparcie jest dopasowane do konkretnej potrzeby.",
          category: "dostep_do_uslug",
          score: 0.78,
          why: "To jest dla osób takich jak Ty: ktoś może przeczytać etykietę i pomóc znaleźć produkt.",
        },
        {
          innovation_id: "seed",
          title: "Puzzle 3D",
          summary:
            "Zabawki przestrzenne wspierają naukę alfabetu Braille’a. Dziecko może poznawać znaki przez dotyk i zabawę.",
          category: "niepelnosprawnosc",
          score: 0.71,
          why: "To też jest o wzroku: alfabet Braille’a poznaje się przez dotyk, nie przez czytanie druku.",
        },
      ],
      similar_needs: {
        count: 9,
        example: "Szukam innowacji w Małopolsce dla osoby, która słabo widzi.",
      },
    },
  },
  {
    needles: ["syna z niepełnosprawnością", "syna z niepelnosprawnoscia"],
    response: {
      need_id: "22222222-2222-4222-8222-222222222202",
      extracted: {
        category: "niepelnosprawnosc",
        target_group: "osoby z niepełnosprawnością i ich bliscy",
        location: "gmina",
        keywords: ["syn", "niepełnosprawność", "pomysł"],
      },
      results: [
        {
          innovation_id: "seed",
          title: "Edki – kredki terapeutyczne",
          summary:
            "Specjalnie ukształtowane kredki wspierają dzieci ze spastycznością dłoni. Terapia odbywa się podczas rysowania i zabawy.",
          category: "niepelnosprawnosc",
          score: 0.84,
          why: "To jest konkretna pomoc dla dziecka: ćwiczy dłoń w zwykłej zabawie, razem z rodzicem.",
        },
        {
          innovation_id: "seed",
          title: "Patryk i Kropka",
          summary:
            "Opowiadania łatwe do czytania pomagają młodzieży z niepełnosprawnością intelektualną rozumieć codzienne sytuacje. Wspierają rozmowę i samodzielność.",
          category: "niepelnosprawnosc",
          score: 0.76,
          why: "To jest materiał, który rodzic może czytać razem z dzieckiem, prostym językiem.",
        },
        {
          innovation_id: "seed",
          title: "Zakupy bez barier",
          summary:
            "Klient może dyskretnie poprosić przeszkolonego pracownika sklepu o pomoc. Wsparcie jest dopasowane do konkretnej potrzeby.",
          category: "dostep_do_uslug",
          score: 0.7,
          why: "To konkretna pomoc w zwykłym miejscu, z której może skorzystać osoba z niepełnosprawnością.",
        },
      ],
      similar_needs: {
        count: 7,
        example: "Szukam wsparcia w Małopolsce dla dziecka z niepełnosprawnością.",
      },
    },
  },
  {
    needles: ["samotni", "dojechać do lekarza", "dojechac do lekarza"],
    response: {
      need_id: "22222222-2222-4222-8222-222222222203",
      extracted: {
        category: "samotnosc",
        target_group: "seniorzy",
        location: "gmina wiejska",
        keywords: ["samotność", "lekarz", "transport", "seniorzy"],
      },
      results: [
        {
          innovation_id: "seed",
          title: "Mobilne centrum pomocy dla osób starszych",
          summary:
            "Specjaliści dojeżdżają do seniorów mieszkających na wsi. Pomoc może obejmować zdrowie, finanse, prawo i codzienne sprawy.",
          category: "samotnosc",
          score: 0.88,
          why: "To pasuje, bo piszesz, że starsi sąsiedzi są samotni i nie mogą dojechać do lekarza: pomoc przyjeżdża do nich.",
        },
        {
          innovation_id: "seed",
          title: "Organizator kompleksowej opieki w miejscu zamieszkania",
          summary:
            "Koordynator pomaga rodzinie zorganizować opiekę po wypisie seniora ze szpitala. Łączy potrzebne usługi i sprzęt.",
          category: "dostep_do_uslug",
          score: 0.79,
          why: "To układa opiekę w domu, gdy dojazd do lekarza i szpitala jest trudny.",
        },
        {
          innovation_id: "seed",
          title: "Terapeuta przestrzeni",
          summary:
            "Specjalista pomaga seniorowi bezpieczniej urządzić mieszkanie. Wykorzystuje przede wszystkim proste i niedrogie zmiany.",
          category: "starzenie",
          score: 0.72,
          why: "To pomaga seniorowi dłużej radzić sobie w domu, gdy wyjście do lekarza jest trudne.",
        },
      ],
      similar_needs: {
        count: 12,
        example: "Seniorzy w gminie wiejskiej nie mają transportu do przychodni.",
      },
    },
  },
];

function fold(value: string) {
  return value
    .toLowerCase()
    .replaceAll("ł", "l")
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

const SITUATIONS: { triggers: string[]; problems: string[] }[] = [
  { triggers: ["wytchn", "odciaz"], problems: ["wytchn", "odciaz", "wypal", "zastep", "odpocz"] },
  { triggers: ["nieslys", "gluch", "migow"], problems: ["gluch", "pjm", "migow", "nieslys"] },
  { triggers: ["niewid", "braille", "niedowid"], problems: ["niewid", "braille", "wzrok", "audiod"] },
  { triggers: ["dojazd", "dojech", "lekarz", "przychod"], problems: ["dojazd", "lekarz", "przychod", "transport"] },
  { triggers: ["samot", "osamot"], problems: ["samot", "izol", "towarz"] },
  { triggers: ["wychodz", "boi sie"], problems: ["samot", "izol", "towarz"] },
];

function catalogMatch(query: string): MatchResponse {
  const folded = fold(query);
  const words = folded.split(/\s+/).filter((word) => word.length > 3);
  const active = SITUATIONS.filter((situation) => situation.triggers.some((trigger) => folded.includes(trigger)));
  const ranked = innovations
    .map((item) => {
      const haystack = fold(
        [item.title, item.summary, item.description, item.tags.join(" "), item.target_groups.join(" ")].join(" "),
      );
      const direct = words.reduce((sum, word) => sum + (haystack.includes(word.slice(0, 5)) ? 3 : 0), 0);
      const situation = active.reduce((sum, entry) => {
        const sameProblem = entry.problems.some((problem) => haystack.includes(problem.slice(0, 5)));
        return sum + (sameProblem ? 8 : -6);
      }, 0);
      return { item, score: direct + situation };
    })
    .sort((a, b) => b.score - a.score);
  const useful = ranked.filter((row) => row.score > 0).slice(0, 5);
  const picked = useful.length >= 3 ? useful : ranked.slice(0, 5);

  return {
    need_id: "00000000-0000-4000-8000-000000000000",
    extracted: {
      category: "inne",
      target_group: "mieszkańcy",
      location: null,
      keywords: words.slice(0, 5),
    },
    results: picked.map(({ item, score }) => ({
      innovation_id: item.id,
      title: item.title,
      summary: item.summary,
      category: item.category,
      score: Math.min(0.49, 0.2 + score * 0.08),
      why:
        score > 0
          ? `To skojarzenie z Twoją sprawą: ${item.summary}`
          : `Nie ma dokładnego trafienia. Najbliższe skojarzenie: ${item.summary}`,
    })),
    similar_needs: { count: 0, example: null },
  };
}

export function localMatch(query: string): MatchResponse {
  const folded = fold(query);
  const hit = DEMOS.find((demo) =>
    demo.needles.some((needle) => folded.includes(fold(needle))),
  );
  if (hit) return hit.response;
  return catalogMatch(query);
}
