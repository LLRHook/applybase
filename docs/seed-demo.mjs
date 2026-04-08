#!/usr/bin/env node
// docs/seed-demo.mjs
//
// Populate the app's SQLite database with a cohesive, visually-rich demo
// dataset for README screenshots. Works by writing directly to the libsql
// database file, bypassing the REST API — this is necessary because the
// API hard-codes `appliedAt = new Date().toISOString()` on every create,
// which would produce a DB full of "1 minute ago" rows and a sparse
// velocity chart.
//
// Usage:
//   1. Stop the dev server (this script holds an exclusive DB write lock)
//   2. Run: `node docs/seed-demo.mjs`
//   3. Restart the dev server
//
// Shape of the generated dataset (all deterministic, seeded random):
//   - ~160 jobs spread across the last 14 weeks
//   - Status distribution: ~50% applied, 15% screening, 8% technical,
//     4% onsite, 2% offer, 1% accepted, 15% rejected, 3% withdrawn, 2% archived
//   - Realistic time gaps between stage transitions (1-10 days)
//   - Job ID 1 is specifically enriched for the detail-page screenshot
//     (Datadog Staff SWE with salary, notes, talking points, follow-up)
//
// Safe to re-run: truncates jobs + stage_events before seeding. Does NOT
// touch settings, so your resume-variants customization is preserved.

// Resolve @libsql/client from app/node_modules without requiring docs/ to
// be an npm workspace on its own. The script stays in docs/ because it's a
// documentation/screenshot tool, not an app-runtime one.
import { createRequire } from "module";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(resolve(__dirname, "../app/package.json"));
const { createClient } = require("@libsql/client");

const DB_PATH = resolve(__dirname, "../app/data/jobsearch.db");

// ─── deterministic PRNG so re-runs produce the same dataset ──────────────
let seed = 0x4a6f6273; // "Jobs"
function rand() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 0x100000000;
}
function pick(arr) { return arr[Math.floor(rand() * arr.length)]; }
function randInt(min, max) { return Math.floor(rand() * (max - min + 1)) + min; }

// ─── content library ─────────────────────────────────────────────────────
const COMPANIES = [
  // Payments & fintech
  "Stripe", "Plaid", "Wise", "Mercury", "Brex", "Ramp", "Affirm", "Chime",
  // Dev tools & infra
  "Datadog", "GitHub", "GitLab", "Linear", "Vercel", "Netlify", "Render",
  "Fly.io", "Railway", "Supabase", "Neon", "PlanetScale", "Cloudflare",
  "Fastly", "Modal", "Resend", "Clerk", "Auth0", "Sentry", "LaunchDarkly",
  "Unleash", "Upstash",
  // AI
  "Anthropic", "OpenAI", "Cohere", "Mistral", "Hugging Face", "Replicate",
  "Perplexity", "Runway", "Pika", "Together AI",
  // Productivity & collab
  "Notion", "Linear", "Height", "Figma", "Miro", "Loom", "Slack", "Zoom",
  // Data & analytics
  "Snowflake", "Databricks", "PostHog", "Amplitude", "Mixpanel", "Segment",
  "Metabase",
  // Commerce
  "Shopify", "Checkout.com", "Faire", "Whatnot",
  // Developer-adjacent
  "Hex", "Retool", "Airplane", "Prefect", "Dagster", "Temporal",
  // Consumer / misc tech
  "Reddit", "Discord", "Instacart", "DoorDash", "Coinbase", "Robinhood",
  "Figma", "Webflow", "Framer",
];

const ROLES_BY_RESUME = {
  backend: [
    "Backend Engineer", "Senior Backend Engineer", "Staff Backend Engineer",
    "Backend Engineer, Payments", "Backend Engineer, Identity",
    "Backend Engineer, Platform", "Backend Engineer, API",
    "Senior Engineer, Infrastructure", "Senior Platform Engineer",
    "Staff Engineer, Distributed Systems",
  ],
  fullstack: [
    "Full Stack Engineer", "Senior Full Stack Engineer",
    "Senior Software Engineer", "Staff Software Engineer",
    "Software Engineer, Product", "Senior Product Engineer",
    "Full Stack Developer", "Senior Engineer, Growth",
  ],
  lead: [
    "Engineering Manager", "Senior Engineering Manager", "Tech Lead",
    "Tech Lead, Infrastructure", "Tech Lead, Platform",
    "Staff Software Engineer", "Distinguished Engineer",
    "Principal Engineer", "Director of Engineering",
  ],
  "ai-integration": [
    "AI Engineer", "Senior AI Engineer", "AI Platform Engineer",
    "Software Engineer, AI", "Machine Learning Engineer",
    "Senior ML Engineer", "Research Engineer, LLM",
    "Full Stack AI Engineer",
  ],
};

const SOURCES = ["linkedin", "linkedin", "linkedin", "company_site", "company_site",
                 "wellfound", "hackernews", "referral", "indeed", "glassdoor", "other"];

// ─── status distribution (weights sum to 100) ────────────────────────────
const STATUS_DISTRIBUTION = [
  ["applied",    50],
  ["screening",  15],
  ["technical",   8],
  ["onsite",      4],
  ["offer",       2],
  ["accepted",    1],
  ["rejected",   15],
  ["withdrawn",   3],
  ["archived",    2],
];

function pickStatus() {
  const roll = rand() * 100;
  let acc = 0;
  for (const [status, w] of STATUS_DISTRIBUTION) {
    acc += w;
    if (roll < acc) return status;
  }
  return "applied";
}

// Stages walked on the way to each target (for building stage_events rows)
const FORWARD_STAGES = ["applied", "screening", "technical", "onsite", "offer", "accepted"];
function stagePathTo(target) {
  // Terminal branches — just one transition from "applied"
  if (target === "rejected" || target === "withdrawn" || target === "archived") {
    return ["applied", target];
  }
  // Forward progression through FORWARD_STAGES up to and including target
  const idx = FORWARD_STAGES.indexOf(target);
  if (idx < 0) return ["applied"];
  return FORWARD_STAGES.slice(0, idx + 1);
}

// ─── date helpers ────────────────────────────────────────────────────────
const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = Date.now();
const HORIZON_WEEKS = 14;

// Lognormal-ish bias: most applications are in the last ~6 weeks, few are
// further back. Produces a nicely rising velocity chart.
function randomAppliedDate() {
  const weeksAgo = Math.floor(Math.pow(rand(), 1.7) * HORIZON_WEEKS);
  const daysInWeek = randInt(0, 6);
  const hours = randInt(9, 19);
  const minutes = randInt(0, 59);
  const t = new Date(NOW - (weeksAgo * 7 + daysInWeek) * DAY_MS);
  t.setHours(hours, minutes, 0, 0);
  return t;
}

// Format a Date as SQLite-default "YYYY-MM-DD HH:MM:SS" (naive, what
// `datetime('now')` produces). This is what the server stores in
// createdAt columns, and the client's toUtc() normalizer treats these
// as UTC.
function toSqliteText(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

// Format a Date as ISO-8601 UTC (what appliedAt/updatedAt use)
function toIso(d) { return d.toISOString(); }

// ─── job generation ──────────────────────────────────────────────────────
function generateJob(company, statusOverride, appliedOverride) {
  const resume = pick(Object.keys(ROLES_BY_RESUME));
  const title = pick(ROLES_BY_RESUME[resume]);
  const status = statusOverride || pickStatus();
  const applied = appliedOverride || randomAppliedDate();
  const source = pick(SOURCES);
  const locations = ["Remote", "Remote, US", "San Francisco, CA", "New York, NY",
                     "Seattle, WA", "Austin, TX", "Boston, MA", "Remote (Worldwide)"];
  const location = pick(locations);

  return {
    title,
    employer: company,
    jobUrl: `https://${company.toLowerCase().replace(/[^a-z0-9]/g, "")}.com/careers/${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${randInt(1000, 9999)}`,
    location,
    remote: location.startsWith("Remote") ? 1 : 0,
    resume_used: resume,
    found_via: source,
    status,
    applied_at: toIso(applied),   // ISO-8601 with Z
    created_at: toSqliteText(applied), // matches SQLite default format
    updated_at: toIso(applied),
  };
}

// ─── main ────────────────────────────────────────────────────────────────
async function main() {
  console.log(`Seeding demo data → ${DB_PATH}`);
  const db = createClient({ url: `file:${DB_PATH}` });

  // Sanity check: does the schema exist?
  const tables = await db.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('jobs','stage_events')"
  );
  if (tables.rows.length !== 2) {
    console.error("ERROR: jobs/stage_events tables missing. Run migrations first:");
    console.error("  npx tsx packages/server/src/db/migrate.ts");
    process.exit(1);
  }

  // Reset job data (leave settings alone so resume variants etc. survive)
  await db.execute("DELETE FROM stage_events");
  await db.execute("DELETE FROM jobs");
  await db.execute("DELETE FROM sqlite_sequence WHERE name IN ('jobs','stage_events')");
  console.log("  cleared jobs + stage_events");

  // ── Job 1: the enriched Datadog row for the detail screenshot ──────
  // Created first so it lands at id = 1 (shoot.mjs targets /applications/1)
  // Applied 5 days ago, currently at "technical" with timeline entries.
  const datadogApplied = new Date(NOW - 5 * DAY_MS);
  datadogApplied.setHours(10, 14, 0, 0);
  const datadog = generateJob("Datadog", "technical", datadogApplied);
  datadog.title = "Staff Software Engineer";
  datadog.resume_used = "lead";
  datadog.found_via = "linkedin";
  datadog.location = "New York, NY";
  datadog.remote = 0;
  datadog.jobUrl = "https://datadoghq.com/careers/staff-engineer/2";

  const followUpDate = new Date(NOW + 3 * DAY_MS).toISOString().slice(0, 10);

  await db.execute({
    sql: `INSERT INTO jobs (
      id, title, employer, job_url, location, remote, status,
      resume_used, found_via, salary_min, salary_max, salary_currency,
      company_notes, talking_points, questions_to_ask, interview_notes,
      follow_up_date, follow_up_done,
      applied_at, created_at, updated_at
    ) VALUES (
      1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?
    )`,
    args: [
      datadog.title, datadog.employer, datadog.jobUrl, datadog.location,
      datadog.remote, datadog.status, datadog.resume_used, datadog.found_via,
      220000, 285000, "USD",
      "Datadog is aggressively hiring senior ICs across its observability, APM, and distributed tracing teams. Recent shift toward AI-powered incident detection — a good place to pitch LLM integration experience.",
      "1. Monolith-to-microservices migration story\n2. Experience with high-volume metrics ingestion (sub-second p99)\n3. On-call culture leadership — moved a team from 30min → 5min MTTR\n4. OpenTelemetry integration patterns",
      "1. What's the breakdown between greenfield features vs. maintenance on this team?\n2. How does the on-call rotation work for staff-level ICs?\n3. What's the review and promotion bar between staff and senior staff?\n4. What are the top three problems the team is prioritizing this quarter?",
      "First tech call went well — focused on distributed systems design. Interviewer hinted the next round would cover an on-call scenario + a mini system-design whiteboard. Schedule a follow-up by end of week.",
      followUpDate,
      datadog.applied_at, datadog.created_at, datadog.updated_at,
    ],
  });

  // Datadog stage events: applied → screening (2 days later) → technical (3 days after that)
  const dd1 = datadogApplied;
  const dd2 = new Date(dd1.getTime() + 2 * DAY_MS + 3 * 60 * 60 * 1000);
  const dd3 = new Date(dd2.getTime() + 3 * DAY_MS + 5 * 60 * 60 * 1000);
  for (const [stage, when] of [["applied", dd1], ["screening", dd2], ["technical", dd3]]) {
    await db.execute({
      sql: `INSERT INTO stage_events (job_id, stage, outcome, actor, created_at) VALUES (1, ?, 'pending', 'user', ?)`,
      args: [stage, toSqliteText(when)],
    });
  }

  // ── Bulk jobs: ~160 more, distributed across the horizon ───────────
  const JOB_COUNT = 160;
  let inserted = 1; // Datadog already in

  for (let i = 0; i < JOB_COUNT; i++) {
    const company = pick(COMPANIES);
    const job = generateJob(company);

    const result = await db.execute({
      sql: `INSERT INTO jobs (
        title, employer, job_url, location, remote, status,
        resume_used, found_via, applied_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        job.title, job.employer, job.jobUrl, job.location, job.remote,
        job.status, job.resume_used, job.found_via,
        job.applied_at, job.created_at, job.updated_at,
      ],
    });
    const jobId = Number(result.lastInsertRowid);

    // Walk through stage events with 1-10 day gaps between each transition
    const path = stagePathTo(job.status);
    let t = new Date(job.created_at.replace(" ", "T") + "Z");
    for (let s = 0; s < path.length; s++) {
      if (s > 0) {
        t = new Date(t.getTime() + randInt(1, 10) * DAY_MS + randInt(1, 8) * 60 * 60 * 1000);
        if (t.getTime() > NOW) t = new Date(NOW - randInt(1, 6) * 60 * 60 * 1000);
      }
      await db.execute({
        sql: `INSERT INTO stage_events (job_id, stage, outcome, actor, created_at) VALUES (?, ?, 'pending', 'user', ?)`,
        args: [jobId, path[s], toSqliteText(t)],
      });
    }
    inserted++;
  }

  console.log(`  inserted ${inserted} jobs + stage events`);

  // Verify counts
  const jc = await db.execute("SELECT COUNT(*) as c FROM jobs");
  const sc = await db.execute("SELECT COUNT(*) as c FROM stage_events");
  console.log(`  verification: ${jc.rows[0].c} jobs, ${sc.rows[0].c} stage events`);

  console.log("Seed complete.");
  db.close();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
