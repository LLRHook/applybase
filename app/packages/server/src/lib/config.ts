import { config as loadDotenv } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Load .env from the monorepo root, regardless of which workspace the server
// is launched from. Without this, `npm run dev -w @jobsearch/server` sets cwd
// to packages/server/ and dotenv never finds the .env file at the repo root.
//
// __dirname here resolves to packages/server/src/lib, so the monorepo root is
// four levels up: lib → src → server → packages → <root>
const __dirname = dirname(fileURLToPath(import.meta.url));
const MONOREPO_ROOT = resolve(__dirname, "../../../..");
loadDotenv({ path: resolve(MONOREPO_ROOT, ".env") });

export interface AppConfig {
  port: number;
  nodeEnv: string;
  databasePath: string;
  baseUrl: string;
}

let config: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (!config) {
    // Resolve relative database paths against the monorepo root so
    // `./data/...` means the same thing whether the process runs from the
    // repo root, from packages/server/, or from inside a Docker container.
    const rawDbPath = process.env.DATABASE_PATH || "./data/jobsearch.db";

    config = {
      port: parseInt(process.env.PORT || "44455", 10),
      nodeEnv: process.env.NODE_ENV || "development",
      databasePath: resolve(MONOREPO_ROOT, rawDbPath),
      baseUrl: process.env.BASE_URL || "http://localhost:44455",
    };
  }
  return config;
}
