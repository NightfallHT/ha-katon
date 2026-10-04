"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/**
 * The logo alone was not readable as "go home", so every subpage gets an
 * explicit back link. Rendered once in the layout and hidden on the home page
 * itself, so no page has to remember to add it.
 */
export function BackHome() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return (
    <Link href="/" className="back-home">
      <ArrowLeft aria-hidden="true" />
      Wróć do strony głównej
    </Link>
  );
}
