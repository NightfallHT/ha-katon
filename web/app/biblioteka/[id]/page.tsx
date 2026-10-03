import Link from "next/link";
import { notFound } from "next/navigation";
import { InnovationCard } from "@/components/innovation-card";
import { ResourceNav } from "@/components/resource-nav";
import { getInnovation, similarInnovations } from "@/content/catalog";
import { categoryLabel, stageLabel } from "@/content/labels";

export default async function InnovationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = getInnovation(id);
  if (!item) notFound();
  const similar = similarInnovations(item);

  return (
    <article>
      <ResourceNav current="/biblioteka" />
      <p className="mb-3">
        <Link href="/biblioteka" className="underline underline-offset-4">
          Wróć do biblioteki
        </Link>
      </p>
      <h1 className="text-3xl font-bold">{item.title}</h1>
      <p className="mt-3">
        {categoryLabel(item.category)} · {stageLabel(item.stage)} ·{" "}
        {item.region ?? "Małopolska"}
      </p>
      <p className="mt-4 text-lg">{item.summary}</p>

      <section className="mt-8 space-y-3">
        <h2 className="text-2xl font-bold">Na czym polega rozwiązanie?</h2>
        <p>{item.description}</p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-2xl font-bold">Komu może pomóc?</h2>
        <ul className="list-disc pl-6">
          {item.target_groups.map((group) => (
            <li key={group}>{group}</li>
          ))}
        </ul>
      </section>

      {item.video_url ? (
        <section className="mt-8 space-y-3">
          <h2 className="text-2xl font-bold">Film</h2>
          <iframe
            title={`Film: ${item.title}`}
            src={item.video_url}
            className="aspect-video w-full max-w-3xl rounded-xl border"
            allowFullScreen
          />
          <p>Opis filmu: krótka prezentacja rozwiązania „{item.title}”.</p>
        </section>
      ) : null}

      <section className="mt-8 space-y-2">
        <h2 className="text-2xl font-bold">Kontakt i źródło</h2>
        {item.contact_org ? <p>Organizacja: {item.contact_org}</p> : null}
        {item.source_url ? (
          <p>
            <a
              className="underline underline-offset-4"
              href={item.source_url}
              rel="noreferrer"
            >
              Źródło
            </a>
          </p>
        ) : null}
      </section>

      <section className="mt-10 rounded-xl border p-4">
        <h2 className="text-2xl font-bold">Przetestuj i oceń</h2>
        <p className="mt-2">
          Formularz zgłoszenia do testu doda Jakub. Na razie możesz zapamiętać
          to rozwiązanie i wrócić później.
        </p>
        {/* TODO(jakub): <TesterPanel innovationId={item.id} /> */}
      </section>

      {similar.length ? (
        <section className="mt-10">
          <h2 className="text-2xl font-bold">Podobne rozwiązania</h2>
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {similar.map((other) => (
              <li key={other.id}>
                <InnovationCard innovation={other} compact />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
