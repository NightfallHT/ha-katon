/**
 * Verifies that Supabase is reachable and that db/schema.sql has been applied.
 *
 *   nix-shell --run 'npm run check:supabase'
 *
 * Reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from the root .env (gitignored).
 * Never prints the key. Safe to run as often as you like; it only reads.
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const TABLES = [
  "innovations",
  "challenges",
  "materials",
  "needs",
  "calls",
  "submissions",
  "messages",
  "reviews",
  "gminas",
] as const;

const ok = (m: string) => console.log(`  \x1b[32m✓\x1b[0m ${m}`);
const bad = (m: string) => console.log(`  \x1b[31m✗\x1b[0m ${m}`);
const warn = (m: string) => console.log(`  \x1b[33m!\x1b[0m ${m}`);

function fail(message: string, hint: string): never {
  bad(message);
  console.log(`\n${hint}\n`);
  process.exit(1);
}

const url = process.env.SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

console.log("\nSupabase check\n");

if (!url) {
  fail(
    "SUPABASE_URL is not set",
    "Create a .env in the repo root (it is gitignored) with:\n" +
      "  SUPABASE_URL=https://<your-ref>.supabase.co\n" +
      "  SUPABASE_SERVICE_ROLE_KEY=sb_secret_...\n" +
      "See docs/setup-deploy.md §1.",
  );
}
if (!key) {
  fail(
    "SUPABASE_SERVICE_ROLE_KEY is not set",
    "Add it to the root .env. Take the SECRET key (sb_secret_...) from\n" +
      "Supabase → Settings → API Keys, not the Legacy API keys tab.",
  );
}

ok(`SUPABASE_URL = ${url}`);

// Guide first-timers away from the deprecated JWT keys without printing anything secret.
if (key.startsWith("sb_secret_")) {
  ok("key looks like a current secret key (sb_secret_…)");
} else if (key.startsWith("eyJ")) {
  warn(
    "key is a LEGACY service_role JWT. It still works, but Supabase disables these\n" +
      "    at the end of 2026 — prefer Settings → API Keys → Create new secret key.",
  );
} else if (key.startsWith("sb_publishable_")) {
  fail(
    "that is the PUBLISHABLE key, not the secret key",
    "SUPABASE_SERVICE_ROLE_KEY needs the sb_secret_... value.\n" +
      "The sb_publishable_... one belongs in web/.env.local as NEXT_PUBLIC_SUPABASE_ANON_KEY.",
  );
} else {
  warn("key format not recognised — continuing anyway");
}

const db = createClient(url, key, { auth: { persistSession: false } });

console.log("\nTables (from db/schema.sql)\n");

let missing = 0;
const problems: string[] = [];
for (const table of TABLES) {
  const { count, error } = await db.from(table).select("*", { count: "exact", head: true });
  if (error) {
    bad(`${table.padEnd(12)} ${error.message}`);
    problems.push(error.message);
    missing++;
  } else {
    ok(`${table.padEnd(12)} ${count ?? 0} rows`);
  }
}

console.log("\nVector search\n");

// A zero vector is enough to prove the function exists with the right signature.
const { error: rpcError } = await db.rpc("match_innovations", {
  query_embedding: Array(1536).fill(0),
  match_count: 1,
});
if (rpcError) {
  bad(`match_innovations: ${rpcError.message}`);
  problems.push(rpcError.message);
  missing++;
} else {
  ok("match_innovations() responds");
}

if (missing > 0) {
  const all = problems.join(" ").toLowerCase();
  console.log(`\n${missing} problem(s).`);

  if (all.includes("fetch failed")) {
    console.log(
      "\nNothing answered at all, so this is the URL or the network, not the schema.\n" +
        "Check SUPABASE_URL — it must be the full https://<ref>.supabase.co with no\n" +
        "trailing slash and no /rest/v1 on the end.",
    );
  } else if (all.includes("invalid api key") || all.includes("jwt") || all.includes("unauthorized")) {
    console.log(
      "\nThe project answered but rejected the key. Re-copy the SECRET key from\n" +
        "Supabase → Settings → API Keys (not the Legacy tab), and make sure it was not\n" +
        "truncated on paste.",
    );
  } else {
    console.log(
      "\nThe project answered but these objects are missing, so the schema has not\n" +
        "been applied yet: Supabase → SQL Editor → paste all of db/schema.sql → Run.",
    );
  }
  console.log("\nFull walkthrough: docs/setup-deploy.md §1\n");
  process.exit(1);
}

console.log("\nAll good. Schema is in place.");
console.log("Next: seed data once scripts/seed.ts exists (Ola, task 2).\n");
