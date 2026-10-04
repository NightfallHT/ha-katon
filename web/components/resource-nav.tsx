import Link from "next/link";

// The Zasobnik replaced the separate Biblioteka and Materiały lists: it holds
// the same innovations and materials behind one clickable catalogue.
const LINKS = [
  { href: "/zasobnik", label: "Zasobnik wiedzy" },
  { href: "/wyzwania", label: "Wyzwania" },
  { href: "/kreator", label: "Kreator" },
];

export function ResourceNav({ current }: { current: string }) {
  return (
    <div className="pb-20">
      <nav aria-label="Zasobnik wiedzy" className="mb-8">
        <ul className="flex w-full min-w-0 max-w-full gap-2 overflow-x-auto pb-1">
          {LINKS.map((item) => (
            <li key={item.href} className="shrink-0">
              {item.href === current ? (
                <span className="inline-flex min-h-11 items-center rounded-full bg-primary px-4 font-semibold text-primary-foreground">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 items-center rounded-full border border-border bg-card px-4"
                >
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
