import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env");
config({ path: envPath, quiet: true });

// Usage: npm run seed            inserts rows that are not in the database yet
//        npm run seed -- --dry-run  only prints what would be inserted
// Safe to run again: a row is skipped when a row with the same key already exists.
const dryRun = process.argv.includes("--dry-run");

type Row = Record<string, unknown>;

function loadJson<T>(name: string): T {
  const path = join(root, "data", "seed", name);
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

const norm = (v: unknown) => String(v ?? "").trim().toLowerCase();

// Natural key per table: the columns that identify the same seed row in the database.
const KEYS: Record<string, string[]> = {
  innovations: ["title"],
  challenges: ["title", "powiat"],
  materials: ["title"],
  gminas: ["name", "powiat"],
  calls: ["name"],
  submissions: ["title", "author_email"],
};

const keyOf = (table: string, row: Row) => KEYS[table].map((c) => norm(row[c])).join("|");

async function existingKeys(supabase: SupabaseClient, table: string): Promise<Set<string>> {
  const keys = new Set<string>();
  const cols = KEYS[table].join(",");
  const page = 1000;
  for (let from = 0; ; from += page) {
    const { data, error } = await supabase.from(table).select(cols).range(from, from + page - 1);
    if (error) throw new Error(`Tabela ${table}: ${error.message}`);
    for (const row of (data ?? []) as unknown as Row[]) keys.add(keyOf(table, row));
    if (!data || data.length < page) return keys;
  }
}

async function main() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      [
        existsSync(envPath)
          ? `W pliku ${envPath} brakuje SUPABASE_URL albo SUPABASE_SERVICE_ROLE_KEY.`
          : `Brak pliku ${envPath}.`,
        "Skopiuj .env.example do .env w katalogu głównym repo i uzupełnij blok „scripts”",
        "(osobny klucz sb_secret_ dla seeda, patrz docs/setup-deploy.md §1.3). Seed nie wstawia nic.",
      ].join("\n"),
    );
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const steps: [string, Row[]][] = [
    ["innovations", loadJson<Row[]>("innovations.json")],
    ["challenges", loadJson<Row[]>("challenges.json")],
    ["materials", loadJson<Row[]>("materials.json")],
    ["gminas", loadJson<Row[]>("gminas.json")],
    ["calls", loadJson<Row[]>("calls.json")],
    ["submissions", loadJson<Row[]>("submissions.json")],
  ];

  if (dryRun) console.log("Tryb --dry-run: nic nie zostanie zapisane.");

  let newInnovations = 0;
  for (const [table, rows] of steps) {
    const have = await existingKeys(supabase, table);
    const seen = new Set<string>();
    const missing = rows.filter((row) => {
      const k = keyOf(table, row);
      if (have.has(k) || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    const skipped = rows.length - missing.length;

    if (missing.length && !dryRun) {
      const { error } = await supabase.from(table).insert(missing);
      if (error) {
        console.error(`Tabela ${table}: ${error.message}`);
        process.exit(1);
      }
    }
    if (table === "innovations") newInnovations = missing.length;
    console.log(
      `${table}: ${dryRun ? "do dodania" : "dodano"} ${missing.length}, pominięto ${skipped} (już są w bazie)`,
    );
  }

  const ai = process.env.NEXT_PUBLIC_AI_URL?.replace(/\/$/, "");
  if (ai && newInnovations > 0 && !dryRun) {
    const response = await fetch(`${ai}/admin/reembed`, { method: "POST" });
    console.log(`reembed: ${response.status}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
