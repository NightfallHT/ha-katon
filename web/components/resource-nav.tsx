import Link from "next/link";

const LINKS = [
  { href: "/biblioteka", label: "Biblioteka" },
  { href: "/wyzwania", label: "Wyzwania" },
  { href: "/materialy", label: "Materiały" },
  { href: "/kreator", label: "Kreator" },
];

export function ResourceNav({ current }: { current: string }) {
  return (
    <nav aria-label="Zasobnik wiedzy" className="mb-8">
      <ul className="flex flex-wrap gap-3">
        {LINKS.map((item) => (
          <li key={item.href}>
            {item.href === current ? (
              <span className="inline-flex min-h-11 items-center font-bold">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="inline-flex min-h-11 items-center underline underline-offset-4"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
