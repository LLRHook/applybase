import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./packages/server/src/db/tables/*.ts",
  out: "./packages/server/drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: `file:${process.env.DATABASE_PATH || "./data/jobsearch.db"}`,
  },
});
