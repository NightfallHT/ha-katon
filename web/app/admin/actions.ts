"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// The only way into the admin view now that the header role switcher is gone:
// the "not admin" screen offers this button.
export async function becomeAdmin() {
  const jar = await cookies();
  jar.set("role", "admin", { path: "/", sameSite: "lax" });
  redirect("/admin");
}
