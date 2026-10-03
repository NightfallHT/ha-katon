import Link from "next/link";
import { ResourceNav } from "@/components/resource-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { challenges } from "@/content/catalog";
import { categoryLabel } from "@/content/labels";

export default function WyzwaniaPage() {
  const groups = Object.entries(
    challenges.reduce<Record<string, typeof challenges>>((acc, item) => {
      acc[item.category] ??= [];
      acc[item.category].push(item);
      return acc;
    }, {}),
  );

  return (
    <div>
      <ResourceNav current="/wyzwania" />
      <h1 className="text-3xl font-bold">Wyzwania społeczne w Małopolsce</h1>
      <p className="mt-3 max-w-prose">
        To obszary, w których mieszkańcy i gminy najczęściej potrzebują nowych
        rozwiązań.
      </p>

      {groups.map(([category, items]) => (
        <section key={category} className="mt-10">
          <h2 className="text-2xl font-bold">{categoryLabel(category)}</h2>
          <p className="mt-2">
            <Link
              className="inline-flex min-h-11 items-center underline underline-offset-4"
              href={`/biblioteka?category=${category}`}
            >
              Zobacz rozwiązania
            </Link>
          </p>
          <ul className="mt-4 grid gap-4">
            {items.map((item) => (
              <li key={`${item.title}-${item.powiat}`}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl font-bold">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p>{item.description}</p>
                    <p>
                      Powiat: {item.powiat}. {item.indicator_name}:{" "}
                      {String(item.indicator_value).replace(".", ",")}.
                    </p>
                    <p className="text-muted-foreground">Źródło: {item.source}</p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="mt-12">
        <h2 className="text-2xl font-bold">Te same dane w tabeli</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-left">
            <caption className="mb-2 text-left">
              Wyzwania, wskaźniki i powiaty.
            </caption>
            <thead>
              <tr className="border-b">
                <th scope="col" className="py-3 pr-3">
                  Wyzwanie
                </th>
                <th scope="col" className="py-3 pr-3">
                  Temat
                </th>
                <th scope="col" className="py-3 pr-3">
                  Powiat
                </th>
                <th scope="col" className="py-3 pr-3">
                  Wskaźnik
                </th>
                <th scope="col" className="py-3">
                  Wartość
                </th>
              </tr>
            </thead>
            <tbody>
              {challenges.map((item) => (
                <tr key={`${item.title}-row`} className="border-b">
                  <th scope="row" className="py-3 pr-3 font-medium">
                    {item.title}
                  </th>
                  <td className="py-3 pr-3">{categoryLabel(item.category)}</td>
                  <td className="py-3 pr-3">{item.powiat}</td>
                  <td className="py-3 pr-3">{item.indicator_name}</td>
                  <td className="py-3">
                    {String(item.indicator_value).replace(".", ",")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
