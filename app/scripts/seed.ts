import "dotenv/config";

// Migrations create the schema. There's no seed data to load — users add
// applications via the UI from a clean slate. This script exists so the
// Dockerfile can call `npx tsx scripts/seed.ts` as a stable entry point
// without conditionally branching on whether seed data is needed.

console.log("Clean start — no seed data loaded.");
