import Link from "next/link";
import { HelpBot } from "@/components/help-bot";

const LINKS = [
  { href: "/biblioteka", label: "Biblioteka" },
  { href: "/wyzwania", label: "Wyzwania" },
  { href: "/materialy", label: "Materiały" },
  { href: "/kreator", label: "Kreator" },
];

export function ResourceNav({ current }: { current: string }) {
  return (
    <>
      <nav aria-label="Zasobnik wiedzy" className="mb-8">
        <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
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
      <HelpBot />
    </>
  );
}
