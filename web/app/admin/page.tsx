import Link from "next/link";
import { adminDb } from "./_lib/supabase";

export const dynamic = "force-dynamic";

async function load() {
  const db = adminDb();
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const head = { count: "exact", head: true } as const;
  const [nowe, ocena, pub, needs] = await Promise.all([
    db.from("submissions").select("id", head).eq("status", "nowe"),
    db.from("submissions").select("id", head).eq("status", "w_ocenie"),
    db.from("innovations").select("id", head).eq("published", true),
    db.from("needs").select("id", head).gte("created_at", weekAgo),
  ]);
  return [
    { text: "Nowe zgłoszenia", value: nowe.count ?? 0, href: "/admin/zgloszenia?status=nowe" },
    { text: "W ocenie", value: ocena.count ?? 0, href: "/admin/zgloszenia?status=w_ocenie" },
    { text: "Opublikowane innowacje", value: pub.count ?? 0, href: "/admin/biblioteka" },
    { text: "Zapytania w tym tygodniu", value: needs.count ?? 0, href: "/admin/trendy" },
  ];
}

export default async function AdminHome() {
  let tiles: Awaited<ReturnType<typeof load>> = [];
  let error = "";
  try {
    tiles = await load();
  } catch {
    tiles = [
      { text: "Nowe zgłoszenia", value: 2, href: "/admin/zgloszenia?status=nowe" },
      { text: "W ocenie", value: 1, href: "/admin/zgloszenia?status=w_ocenie" },
      { text: "Opublikowane innowacje", value: 8, href: "/admin/biblioteka" },
      { text: "Zapytania w tym tygodniu", value: 3, href: "/admin/trendy" },
    ];
    error = "Dane poglądowe — baza ROPS nie jest podłączona w tym środowisku.";
  }
  return (
    <section aria-labelledby="pulpit" className="admin-dashboard">
      <div className="admin-dashboard__heading">
        <p className="eyebrow">Przegląd</p>
        <h1 id="pulpit">Pulpit pracownika ROPS</h1>
        <p>Najważniejsze sprawy i treści w jednym miejscu.</p>
      </div>
      {error && <p role="status" className="mt-4 rounded-md border p-3">{error}</p>}
      <ul className="admin-dashboard__tiles">
        {tiles.map((t) => (
          <li key={t.text}>
            <Link href={t.href}>
              <span>{t.value}</span>
              <strong>{t.text}</strong>
              <small>Otwórz widok</small>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
