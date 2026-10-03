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
  } catch (e) {
    error = e instanceof Error ? e.message : "Nie udało się wczytać danych.";
  }
  return (
    <section aria-labelledby="pulpit">
      <h1 id="pulpit" className="text-2xl font-semibold">Pulpit pracownika ROPS</h1>
      {error && <p role="alert" className="mt-4 rounded-md border p-3">{error}</p>}
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {tiles.map((t) => (
          <li key={t.text}>
            <Link href={t.href} className="block rounded-lg border p-5 focus-visible:ring-2 focus-visible:ring-ring">
              <span className="block text-4xl font-bold">{t.value}</span>
              <span className="mt-1 block text-lg">{t.text}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
