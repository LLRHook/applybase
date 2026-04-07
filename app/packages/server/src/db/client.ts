import { resolve } from "path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema.js";
import { getConfig } from "../lib/config.js";

let db: ReturnType<typeof createDb> | null = null;

function createDb() {
  const config = getConfig();
  const absPath = resolve(config.databasePath);
  const client = createClient({
    url: `file:${absPath}`,
  });
  return drizzle(client, { schema });
}

export function getDb() {
  if (!db) {
    db = createDb();
  }
  return db;
}

export type DrizzleDB = ReturnType<typeof getDb>;
