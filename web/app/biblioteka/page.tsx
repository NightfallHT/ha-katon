import { ResourceNav } from "@/components/resource-nav";
import { innovations } from "@/content/catalog";
import { BibliotekaBrowser } from "./biblioteka-browser";

export default async function BibliotekaPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  return (
    <div>
      <ResourceNav current="/biblioteka" />
      <h1 className="text-3xl font-bold">Rozwiązania, które już pomagają</h1>
      <p className="mt-3 max-w-prose">
        Zobacz pomysły testowane lub wdrażane przez inne osoby i instytucje.
      </p>
      <div className="mt-8">
        <BibliotekaBrowser items={innovations} initialCategory={category} />
      </div>
    </div>
  );
}
