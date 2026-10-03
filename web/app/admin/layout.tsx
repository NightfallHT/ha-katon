import Link from "next/link";
import { adminDb } from "./_lib/supabase";
import { isAdmin } from "./_lib/guard";
import { becomeAdmin } from "./actions";

export const dynamic = "force-dynamic";

async function countNew() {
  try {
    const { count } = await adminDb()
      .from("submissions")
      .select("id", { count: "exact", head: true })
      .eq("status", "nowe");
    return count ?? 0;
  } catch {
    return 0;
  }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) {
    return (
      <section aria-labelledby="admin-gate" className="admin-gate">
        <p className="eyebrow">Panel administratora</p>
        <h1 id="admin-gate">
          Ta część jest dla pracowników ROPS
        </h1>
        <p className="mt-3">Przełącz się na rolę pracownika ROPS, aby zobaczyć panel.</p>
        <form action={becomeAdmin} className="mt-4">
          <button type="submit" className="admin-primary-action">
            Przełącz na pracownika ROPS
          </button>
        </form>
      </section>
    );
  }

  const newCount = await countNew();
  const links = [
    { href: "/admin", text: "Pulpit" },
    { href: "/admin/zgloszenia", text: "Zgłoszenia" },
    { href: "/admin/nabory", text: "Nabory" },
    { href: "/admin/biblioteka", text: "Biblioteka" },
    { href: "/admin/trendy", text: "Trendy" },
  ];

  return (
    <div className="admin-shell">
      <header className="admin-shell__masthead">
        <div>
          <p className="eyebrow">Strefa pracownika</p>
          <p>Panel ROPS</p>
        </div>
        <p>Zarządzaj zgłoszeniami, bazą wiedzy i naborami.</p>
      </header>
      <nav aria-label="Panel administratora" className="admin-shell__nav">
        <ul className="flex flex-wrap gap-2">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href}>
                {l.text}
                {l.href === "/admin/zgloszenia" && newCount > 0 && (
                  <span className="ml-2 rounded-full border px-2 text-sm font-semibold">
                    {newCount} <span className="sr-only">nowych zgłoszeń</span>
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {children}
    </div>
  );
}
