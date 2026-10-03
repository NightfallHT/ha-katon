"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Fallback switch link for the "not admin" screen. Ola's header switcher does the same thing.
export async function becomeAdmin() {
  const jar = await cookies();
  jar.set("role", "admin", { path: "/", sameSite: "lax" });
  redirect("/admin");
}
