import { cookies } from "next/headers";

// Demo auth (AGENTS.md section 3): the header role switcher sets the cookie `role`.
export async function isAdmin() {
  const jar = await cookies();
  return jar.get("role")?.value === "admin";
}
