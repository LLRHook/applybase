import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { mkdirSync, existsSync } from "fs";
import "dotenv/config";

async function main() {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const dbPath = process.env.DATABASE_PATH || "./data/jobsearch.db";

  const dir = dirname(resolve(dbPath));
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const client = createClient({ url: `file:${resolve(dbPath)}` });
  const db = drizzle(client);

  const migrationsFolder = resolve(__dirname, "../../drizzle");
  await migrate(db, { migrationsFolder });

  console.log("Migrations complete.");
  client.close();
}

main().catch(console.error);
