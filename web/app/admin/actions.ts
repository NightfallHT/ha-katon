"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Demo sign-in. This is a showcase screen, NOT access control, and it is not
 * meant to be: the pair below is written in the repo, the `role` cookie it
 * sets is unsigned so anyone can set it by hand, and RLS is off in this
 * prototype (AGENTS.md section 3) so the publishable key reads and writes every
 * table straight from the browser regardless. Real deployments need Supabase
 * Auth plus row-level security — it is on the roadmap slide, not in this code.
 */
const DEMO_LOGIN = "admin";
const DEMO_PASSWORD = "admin";

// `login` comes back so a failed attempt does not wipe what was typed. The
// password is deliberately not returned.
export type SignInResult = { ok: boolean; message: string; login?: string };

export async function signIn(
  _prev: SignInResult | null,
  formData: FormData,
): Promise<SignInResult> {
  const login = String(formData.get("login") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (login !== DEMO_LOGIN || password !== DEMO_PASSWORD) {
    return {
      ok: false,
      message: "Nieprawidłowy login lub hasło. W demo to admin i admin.",
      login,
    };
  }
  const jar = await cookies();
  jar.set("role", "admin", { path: "/", sameSite: "lax" });
  redirect("/admin");
}

export async function signOut() {
  const jar = await cookies();
  jar.set("role", "mieszkaniec", { path: "/", sameSite: "lax" });
  redirect("/");
}
