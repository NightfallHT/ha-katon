import { adminDb } from "./_lib/supabase";
import { isAdmin } from "./_lib/guard";
import { signOut } from "./actions";
import { AdminNav } from "./admin-nav";
import { LoginForm } from "./login-form";

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
        <p className="eyebrow">Panel pracownika ROPS</p>
        <h1 id="admin-gate">Zaloguj się do panelu</h1>
        <p className="admin-gate__lead">
          Ta część jest dla pracowników ROPS. W prototypie nie ma kont — jest
          jedno wejście pokazowe.
        </p>
        <LoginForm />
        {/* Printed on purpose: this is a showcase screen, not access control,
            and whoever demonstrates it has to be able to get in. */}
        <p className="admin-gate__demo">
          Dane do demo: login <strong>admin</strong>, hasło <strong>admin</strong>.
        </p>
      </section>
    );
  }

  const newCount = await countNew();
  const links = [
    { href: "/admin", text: "Pulpit" },
    { href: "/admin/zgloszenia", text: "Zgłoszenia", count: newCount },
    { href: "/admin/dane", text: "Dane w bazie" },
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
        <div className="admin-shell__masthead-end">
          <p>Zarządzaj zgłoszeniami, bazą wiedzy i naborami.</p>
          <form action={signOut}>
            <button type="submit" className="admin-shell__signout">
              Wyloguj się
            </button>
          </form>
        </div>
      </header>
      <AdminNav links={links} />
      {children}
    </div>
  );
}
