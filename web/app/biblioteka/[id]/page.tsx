import Link from "next/link";
import { notFound } from "next/navigation";
import { InnovationCard } from "@/components/innovation-card";
import { TesterPanel } from "@/components/tester-panel";
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
    <article className="innovation-detail">
      <header className="innovation-detail__hero">
        <p className="eyebrow">{categoryLabel(item.category)}</p>
        <h1>{item.title}</h1>
        <p className="innovation-detail__summary">{item.summary}</p>
        <p className="innovation-detail__meta">
          {stageLabel(item.stage)} · {item.region ?? "Małopolska"}
        </p>
      </header>

      <section className="innovation-detail__description" aria-labelledby="description-heading">
        <h2 id="description-heading">Opis inicjatywy</h2>
        <p>{item.description}</p>
      </section>

      <TesterPanel innovationId={item.id} innovationTitle={item.title} />

      <div className="innovation-detail__info-grid">
        <section>
          <h2>Komu może pomóc?</h2>
          <ul>
            {item.target_groups.map((group) => (
              <li key={group}>{group}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2>Kontakt i źródło</h2>
          {item.contact_org ? <p>Organizacja: {item.contact_org}</p> : null}
          {item.source_url ? (
            <a href={item.source_url} rel="noreferrer" data-source="innovation">
              Zobacz w bazie ROPS
            </a>
          ) : null}
        </section>
      </div>

      {item.video_url ? (
        <section className="innovation-detail__video">
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

      {similar.length ? (
        <section className="innovation-detail__similar">
          <h2>Podobne rozwiązania</h2>
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {similar.map((other) => (
              <li key={other.id}>
                <InnovationCard innovation={other} compact />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="innovation-detail__back">
        {/* The Zasobnik is the knowledge base now; /biblioteka is only the
            address these detail pages live under. */}
        <Link href="/zasobnik">Wróć do Zasobnika wiedzy</Link>
      </p>
    </article>
  );
}
