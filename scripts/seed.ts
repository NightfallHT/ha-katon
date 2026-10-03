import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

config({ path: join(dirname(fileURLToPath(import.meta.url)), "..", ".env") });

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadJson<T>(name: string): T {
  const path = join(root, "data", "seed", name);
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

async function main() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "Brak SUPABASE_URL albo SUPABASE_SERVICE_ROLE_KEY w pliku .env. Seed nie wstawia nic.",
    );
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const innovations = loadJson<Record<string, unknown>[]>("innovations.json");
  const challenges = loadJson<Record<string, unknown>[]>("challenges.json");
  const materials = loadJson<Record<string, unknown>[]>("materials.json");
  const gminas = loadJson<Record<string, unknown>[]>("gminas.json");
  const calls = loadJson<Record<string, unknown>[]>("calls.json");
  const submissions = loadJson<Record<string, unknown>[]>("submissions.json");

  const steps: [string, Record<string, unknown>[]][] = [
    ["innovations", innovations],
    ["challenges", challenges],
    ["materials", materials],
    ["gminas", gminas],
    ["calls", calls],
    ["submissions", submissions],
  ];

  for (const [table, rows] of steps) {
    const { error } = await supabase.from(table).insert(rows);
    if (error) {
      console.error(`Tabela ${table}: ${error.message}`);
      process.exit(1);
    }
    console.log(`${table}: dodano ${rows.length} wierszy`);
  }

  const ai = process.env.NEXT_PUBLIC_AI_URL?.replace(/\/$/, "");
  if (ai) {
    const response = await fetch(`${ai}/admin/reembed`, { method: "POST" });
    console.log(`reembed: ${response.status}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
