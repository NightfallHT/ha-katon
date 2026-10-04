"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavLink = { href: string; text: string; count?: number };

export function AdminNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Panel administratora" className="admin-shell__nav">
      <ul className="flex flex-wrap gap-2">
        {links.map((link) => {
          // "/admin" only matches itself; the rest also match their subpages,
          // so you can still see where you are while editing a row.
          const current =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <li key={link.href}>
              <Link href={link.href} aria-current={current ? "page" : undefined}>
                {link.text}
                {link.count ? (
                  <span className="admin-shell__nav-count">
                    {link.count} <span className="sr-only">nowych zgłoszeń</span>
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
