import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * The way back inside the panel. It used to be bold text while the global
 * "Wróć do strony głównej" was a button, so people clicked that one by mistake
 * and left the panel. Same pill shape, accent border to tell the two apart.
 */
export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <p className="admin-back-row">
      <Link href={href} className="admin-back">
        <ArrowLeft aria-hidden="true" />
        {children}
      </Link>
    </p>
  );
}
