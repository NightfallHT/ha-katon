import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { budgetLabel, deadlineLabel, getCalls, openCalls, upcomingCalls } from "@/lib/calls";

export async function OpenCalls() {
  const calls = await getCalls();
  const open = openCalls(calls);
  const next = upcomingCalls(calls)[0];

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
                    {budgetLabel(item.budget_max)}.
                  </p>
                  <p className="flex flex-col gap-2">
                    <Link
                      href={`/kreator/grant/wniosek?nabor=${encodeURIComponent(item.name)}`}
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-accent px-4 text-center font-semibold text-accent-foreground"
                    >
                      Złóż wniosek o grant
                    </Link>
                    {item.regulamin_url ? (
                      <a
                        href={item.regulamin_url}
                        className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-border px-4 text-center font-medium"
                      >
                        Regulamin
                      </a>
                    ) : null}
                  </p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3">
          Nabór jest obecnie zamknięty.
          {next ? ` Następny nabór: ${next.name}, termin ${deadlineLabel(next.deadline)}.` : ""}
        </p>
      )}
    </section>
  );
}
