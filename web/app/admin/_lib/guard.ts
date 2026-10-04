import { cookies } from "next/headers";

// Demo auth (AGENTS.md section 3): the cookie `role` is set by becomeAdmin()
// on the "not admin" screen, or by the test helper openAs().
export async function isAdmin() {
  const jar = await cookies();
  return jar.get("role")?.value === "admin";
}
