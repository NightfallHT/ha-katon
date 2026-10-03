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
      <section aria-labelledby="admin-gate">
        <h1 id="admin-gate" className="text-2xl font-semibold">
          Ta część jest dla pracowników ROPS
        </h1>
        <p className="mt-3">Przełącz się na rolę pracownika ROPS, aby zobaczyć panel.</p>
        <form action={becomeAdmin} className="mt-4">
          <button type="submit" className="min-h-11 rounded-md border px-4 py-2 font-medium focus-visible:ring-2 focus-visible:ring-ring">
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
    <div>
      <nav aria-label="Panel administratora" className="mb-8 border-b pb-3">
        <ul className="flex flex-wrap gap-2">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="inline-flex min-h-11 items-center rounded-md px-3 py-2 underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring">
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
