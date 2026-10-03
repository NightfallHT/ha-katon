import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calls } from "@/content/catalog";

function deadlineLabel(iso: string) {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("pl-PL", { dateStyle: "long" }).format(date);
}

export function OpenCalls() {
  const open = calls.filter((item) => item.is_open);
  const closed = calls.filter((item) => !item.is_open);

  return (
    <section data-calls className="mt-10" aria-labelledby="nabory-heading">
      <h2 id="nabory-heading" className="text-2xl font-bold">
        Aktualne nabory
      </h2>
      {open.length ? (
        <ul className="mt-4 grid gap-4">
          {open.map((item) => (
            <li key={item.name}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold break-words">{item.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p>{item.description}</p>
                  <p>
                    Możesz składać do {deadlineLabel(item.deadline)}. Maksymalna kwota:{" "}
                    {item.budget_max.toLocaleString("pl-PL")} zł.
                  </p>
                  <p className="flex flex-col gap-2">
                    <Link
                      href="/kreator/grant"
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-accent px-4 text-center font-semibold text-accent-foreground"
                    >
                      Złóż wniosek o grant
                    </Link>
                    <a
                      href={item.regulamin_url}
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-border px-4 text-center font-medium"
                    >
                      Regulamin
                    </a>
                  </p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3">
          Nabór jest obecnie zamknięty.
          {closed[0] ? ` Następny termin: ${deadlineLabel(closed[0].deadline)}.` : ""}
        </p>
      )}
    </section>
  );
}
