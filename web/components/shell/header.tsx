"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { currentRole, ROLES, writeCookie, type Role } from "@/lib/demo-session";

const BASE_LINKS = [
  { href: "/dopasuj", label: "Dopasuj" },
  { href: "/zasobnik", label: "Zasobnik" },
  { href: "/wyzwania", label: "Wyzwania" },
  { href: "/kreator", label: "Kreator" },
  { href: "/kontakt", label: "Kontakt" },
];

export function Header() {
  const [role, setRole] = useState<Role>("mieszkaniec");

  useEffect(() => {
    const frame = requestAnimationFrame(() => setRole(currentRole()));
    return () => cancelAnimationFrame(frame);
  }, []);

  function changeRole(next: Role) {
    const meta = ROLES.find((item) => item.value === next)!;
    writeCookie("role", next);
    writeCookie("demo_email", meta.email);
    setRole(next);
  }

  const links = [
    ...BASE_LINKS,
    ...(role === "gmina" ? [{ href: "/middleman", label: "Dla gminy" }] : []),
    ...(role === "admin" ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <header className="site-header">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pb-5 pt-28 md:px-8 md:pt-5 lg:pr-[22rem]">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <Link href="/" className="font-bold no-underline">
            <span className="block text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Małopolska
            </span>
            Hub Innowacji Społecznych
          </Link>
          <nav aria-label="Menu główne" className="min-w-0 flex-1">
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {links.map((item) => (
                <li key={item.href}>
                  <Link
                    className="inline-flex min-h-11 items-center font-semibold underline-offset-8 hover:underline"
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <label className="flex min-h-11 items-center gap-2 text-sm font-semibold" htmlFor="role">
            <span className="sr-only md:not-sr-only">Widok:</span>
            <select
              id="role"
              className="h-11 rounded-full border border-input bg-card px-4"
              value={role}
              onChange={(event) => changeRole(event.target.value as Role)}
              aria-label="Oglądasz jako"
            >
              {ROLES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </header>
  );
}
