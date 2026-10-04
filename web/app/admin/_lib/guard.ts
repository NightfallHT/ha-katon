import { cookies } from "next/headers";

// Demo auth (AGENTS.md section 3): the cookie `role` is set by signIn() on the
// login screen, or by the test helper openAs(). The cookie is unsigned, so this
// is a showcase gate and not protection — see the note in ../actions.ts.
export async function isAdmin() {
  const jar = await cookies();
  return jar.get("role")?.value === "admin";
}
