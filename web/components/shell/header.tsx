"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { currentRole, ROLES, writeCookie, type Role } from "@/lib/demo-session";

const BASE_LINKS = [
  { href: "/dopasuj", label: "Dopasuj" },
  { href: "/biblioteka", label: "Biblioteka" },
  { href: "/wyzwania", label: "Wyzwania" },
  { href: "/kreator", label: "Kreator" },
  { href: "/kontakt", label: "Kontakt" },
];

export function Header() {
  const [role, setRole] = useState<Role>("mieszkaniec");
  const [font, setFont] = useState("");
  const [contrast, setContrast] = useState("");

  useEffect(() => {
    setRole(currentRole());
    try {
      setFont(localStorage.getItem("font") ?? "");
      setContrast(localStorage.getItem("contrast") ?? "");
    } catch {
      /* ignore */
    }
  }, []);

  function applyFont(next: string) {
    setFont(next);
    const html = document.documentElement;
    if (next) html.setAttribute("data-font", next);
    else html.removeAttribute("data-font");
    try {
      if (next) localStorage.setItem("font", next);
      else localStorage.removeItem("font");
    } catch {
      /* ignore */
    }
  }

  function applyContrast(on: boolean) {
    const next = on ? "high" : "";
    setContrast(next);
    const html = document.documentElement;
    if (next) html.setAttribute("data-contrast", next);
    else html.removeAttribute("data-contrast");
    try {
      if (next) localStorage.setItem("contrast", next);
      else localStorage.removeItem("contrast");
    } catch {
      /* ignore */
    }
  }

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
    <header className="border-b">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4">
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/" className="font-semibold">
            Hub Innowacji Społecznych
          </Link>
          <nav aria-label="Menu główne" className="flex-1">
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              {links.map((item) => (
                <li key={item.href}>
                  <Link
                    className="inline-flex min-h-11 items-center underline underline-offset-4"
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="role" className="mb-1 block font-medium">
              Oglądasz jako:
            </label>
            <select
              id="role"
              className="h-11 min-h-11 rounded-lg border border-input bg-card px-3"
              value={role}
              onChange={(event) => changeRole(event.target.value as Role)}
            >
              {ROLES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <fieldset>
            <legend className="mb-1 font-medium">Wielkość tekstu</legend>
            <div className="flex gap-2">
              <button
                type="button"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border px-3"
                aria-pressed={font === ""}
                onClick={() => applyFont("")}
              >
                A
              </button>
              <button
                type="button"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border px-3 text-lg"
                aria-pressed={font === "125"}
                onClick={() => applyFont("125")}
              >
                A+
              </button>
              <button
                type="button"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border px-3 text-xl"
                aria-pressed={font === "150"}
                onClick={() => applyFont("150")}
              >
                A++
              </button>
            </div>
          </fieldset>
          <button
            type="button"
            className="inline-flex min-h-11 items-center rounded-lg border px-4"
            aria-pressed={contrast === "high"}
            onClick={() => applyContrast(contrast !== "high")}
          >
            {contrast === "high" ? "Wyłącz wysoki kontrast" : "Wysoki kontrast"}
          </button>
        </div>
      </div>
    </header>
  );
}
