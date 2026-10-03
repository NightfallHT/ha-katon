import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Innovation } from "@/content/catalog";
import { categoryLabel, stageLabel } from "@/content/labels";

type Props = {
  innovation: Innovation;
  why?: string;
  compact?: boolean;
};

function ratingText(innovation: Innovation) {
  if (!innovation.ratings_count) return "Brak ocen";
  const value = innovation.avg_rating.toFixed(1).replace(".", ",");
  return `${value} z 5, ocen: ${innovation.ratings_count}`;
}

export function InnovationCard({ innovation, why, compact }: Props) {
  const heading = compact ? "h3" : "h2";
  const Heading = heading;

  return (
    <Card className="h-full">
      <div
        className="h-1.5 bg-gradient-to-r from-primary to-accent"
        aria-hidden
      />
      <CardHeader>
        {innovation.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={innovation.image_url}
            alt={innovation.image_alt || ""}
            className="mb-3 h-40 w-full object-cover"
          />
        ) : null}
        <p>
          <Badge variant="outline" className="rounded-full">
            {categoryLabel(innovation.category)}
          </Badge>
        </p>
        <Heading className="font-heading text-xl font-bold leading-snug tracking-tight">
          <Link
            href={`/biblioteka/${innovation.id}`}
            className="underline-offset-4 hover:underline"
          >
            {innovation.title}
          </Link>
        </Heading>
      </CardHeader>
      <CardContent className="space-y-3">
        <p>{innovation.summary}</p>
        <p className="text-muted-foreground">
          Etap: {stageLabel(innovation.stage)}. {ratingText(innovation)}.
          {innovation.target_groups.length
            ? ` Dla kogo: ${innovation.target_groups.join(", ")}.`
            : ""}
        </p>
        {why ? (
          <p
            className="rounded-2xl px-3 py-2"
            style={{
              background: "var(--why)",
              borderLeft: "5px solid var(--why-border)",
            }}
          >
            <strong>Dlaczego to pasuje. </strong>
            {why}
          </p>
        ) : null}
        <p className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-4 font-semibold text-accent-foreground"
            href={`/biblioteka/${innovation.id}`}
          >
            Zobacz szczegóły
          </Link>
          {innovation.source_url ? (
            <a
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-border px-4 font-medium"
              href={innovation.source_url}
              rel="noreferrer"
              data-source="innovation"
            >
              Zobacz w bazie ROPS
            </a>
          ) : null}
        </p>
      </CardContent>
    </Card>
  );
}
