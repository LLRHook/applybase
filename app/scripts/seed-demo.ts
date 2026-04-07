import "dotenv/config";
import { createClient } from "@libsql/client";

// Bulk demo seed: ~250 backdated job applications spread over the last 90 days,
// across realistic statuses, employers, resumes, and sources. Used to populate
// the dashboard / analytics views for screenshots and demos.

const dbPath = process.env.DATABASE_PATH || "./data/jobsearch.db";
const client = createClient({ url: `file:${dbPath}` });

const COMPANIES = [
  "Stripe", "Datadog", "Linear", "Plaid", "Vercel", "Anthropic", "Notion",
  "Supabase", "Render", "OpenAI", "Cloudflare", "Fly.io", "Clerk", "PostHog",
  "Railway", "Resend", "Modal", "Neon", "GitHub", "GitLab", "Figma",
  "Discord", "Slack", "Asana", "Atlassian", "Square", "Block", "Coinbase",
  "Robinhood", "Brex", "Ramp", "Mercury", "Airbnb", "DoorDash", "Instacart",
  "Uber", "Lyft", "Pinterest", "Reddit", "Snap", "Shopify", "Wix",
  "Webflow", "Retool", "Hashicorp", "Confluent", "MongoDB", "Elastic",
  "Snowflake", "Databricks", "Dagster", "Prefect", "dbt Labs", "Hex",
  "Hugging Face", "Cohere", "Replicate", "Pinecone", "Weights & Biases",
  "LangChain", "Mistral", "Perplexity", "ElevenLabs", "Runway", "Scale AI",
  "Twilio", "SendGrid", "Algolia", "Pusher", "Ably", "PlanetScale",
  "Turso", "Xata", "Cockroach Labs", "Redis", "Upstash", "Vapi",
  "Inngest", "Trigger.dev", "Convex", "Liveblocks", "Sourcegraph",
  "Sentry", "LogRocket", "Honeycomb", "Grafana", "Datafold", "Census",
];

const TITLES = [
  "Senior Backend Engineer", "Staff Software Engineer", "Backend Engineer",
  "Full Stack Engineer", "Senior Full Stack Engineer", "Engineering Manager",
  "Tech Lead", "Principal Engineer", "Senior Software Engineer",
  "Software Engineer, Backend", "Software Engineer, Platform",
  "AI Engineer", "Senior AI Engineer", "ML Platform Engineer",
  "Infrastructure Engineer", "Senior Infrastructure Engineer",
  "Distinguished Engineer", "Software Engineer, Growth",
  "Senior Engineer, Payments", "Backend Engineer, Identity",
  "Platform Engineer", "Developer Experience Engineer",
];

const LOCATIONS = [
  "Remote", "San Francisco, CA", "New York, NY", "Remote (US)",
  "Seattle, WA", "Austin, TX", "Boston, MA", "Remote (Worldwide)",
  "London, UK", "Berlin, DE", "Toronto, ON",
];

const RESUMES = ["backend", "fullstack", "lead", "ai-integration"];
const SOURCES = ["linkedin", "indeed", "glassdoor", "wellfound", "hackernews", "company_site", "referral"];

// Status distribution (realistic funnel: most applied/rejected, fewer advance)
const STATUS_WEIGHTS: Array<[string, number]> = [
  ["applied", 45],     // 45% — sitting in inbox
  ["rejected", 30],    // 30% — rejected
  ["screening", 12],   // 12% — phone screen
  ["technical", 6],    // 6% — technical loop
  ["onsite", 3],       // 3% — onsite
  ["offer", 2],        // 2% — offer
  ["accepted", 1],     // 1% — accepted
  ["withdrawn", 1],    // 1% — withdrawn
];

function weightedPick<T>(weights: Array<[T, number]>): T {
  const total = weights.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [val, w] of weights) {
    r -= w;
    if (r <= 0) return val;
  }
  return weights[0][0];
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDateWithinDays(days: number): Date {
  // Bias toward more recent dates (so the chart shows growing activity).
  // Anchor 6 hours in the past to avoid client-side relative timestamps
  // showing "in 2 hours" due to host/container timezone differences.
  const skew = Math.pow(Math.random(), 1.4);
  const ago = Math.floor(skew * days);
  const d = new Date(Date.now() - 6 * 60 * 60 * 1000);
  d.setDate(d.getDate() - ago);
  d.setHours(Math.floor(Math.random() * 12) + 4, Math.floor(Math.random() * 60), 0, 0);
  return d;
}

async function main() {
  console.log("Clearing existing jobs and stage events...");
  await client.execute("DELETE FROM stage_events");
  await client.execute("DELETE FROM jobs");
  await client.execute("DELETE FROM sqlite_sequence WHERE name IN ('jobs','stage_events')");

  // Showcase job at id=1: a fully-fleshed-out application that walked
  // through the pipeline. Used as the target of the README detail screenshot
  // so the detail page actually shows what the app can do (timeline, notes,
  // salary band, talking points, follow-up date) rather than an empty shell.
  console.log("Inserting showcase job at id=1...");
  const showcaseAppliedAt = new Date(Date.now() - 21 * 86400000); // 21d ago
  const showcaseUpdatedAt = new Date(Date.now() - 2 * 86400000); // 2d ago
  await client.execute({
    sql: `INSERT INTO jobs (
      id, title, employer, job_url, location, remote, status,
      resume_used, found_via,
      salary_min, salary_max, salary_currency,
      company_notes, talking_points, questions_to_ask, interview_notes,
      follow_up_date, follow_up_done,
      applied_at, created_at, updated_at
    ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      "Staff Software Engineer, Distributed Systems",
      "Datadog",
      "https://datadoghq.com/careers/staff-distributed-systems",
      "New York, NY",
      0,
      "onsite",
      "lead",
      "referral",
      220000, 280000, "USD",
      "Datadog is hiring aggressively for distributed systems / observability. The team owns the metrics ingestion pipeline at multi-petabyte scale. Heard the org is well-funded and shipping fast.",
      "- Led a 4-engineer team that cut p99 ingestion latency by 40% on a similar pipeline\n- Built a write-ahead-log replacement that handled 2M writes/sec sustained\n- Mentored two engineers from mid to senior in 18 months",
      "- What does on-call rotation look like for the metrics team?\n- How do you balance new product work vs. paying down infra debt?\n- Where does the team feel most under-resourced today?\n- What's the path from Staff to Principal here?",
      "Phone screen with hiring manager went well — she focused on team-building and mentorship more than systems design. Technical loop next week: 1 system design, 2 coding, 1 behavioral with director.",
      new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
      0,
      showcaseAppliedAt.toISOString(),
      showcaseAppliedAt.toISOString(),
      showcaseUpdatedAt.toISOString(),
    ],
  });

  // Backdated stage events that show a realistic walk through the pipeline
  const stages: Array<[string, number]> = [
    ["applied", 21],
    ["screening", 14],
    ["technical", 7],
    ["onsite", 2],
  ];
  for (const [stage, daysAgo] of stages) {
    await client.execute({
      sql: `INSERT INTO stage_events (job_id, stage, outcome, actor, created_at) VALUES (?, ?, ?, ?, ?)`,
      args: [1, stage, "passed", "user", new Date(Date.now() - daysAgo * 86400000).toISOString()],
    });
  }

  const TARGET = 260;
  console.log(`Inserting ${TARGET} backdated jobs...`);

  for (let i = 0; i < TARGET; i++) {
    const employer = pick(COMPANIES);
    const title = pick(TITLES);
    const location = pick(LOCATIONS);
    const remote = location.toLowerCase().includes("remote") ? 1 : 0;
    const resume = pick(RESUMES);
    const source = pick(SOURCES);
    const status = weightedPick(STATUS_WEIGHTS);
    const appliedDate = randomDateWithinDays(90);
    const appliedIso = appliedDate.toISOString();

    const slug = `${employer.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${i}`;
    const url = `https://${employer.toLowerCase().replace(/[^a-z0-9]/g, "")}.com/careers/${slug}`;

    const result = await client.execute({
      sql: `INSERT INTO jobs (
        title, employer, job_url, location, remote, status,
        resume_used, found_via, applied_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [title, employer, url, location, remote, status, resume, source, appliedIso, appliedIso, appliedIso],
    });
    const jobId = Number(result.lastInsertRowid);

    // Always insert the "applied" stage event
    await client.execute({
      sql: `INSERT INTO stage_events (job_id, stage, outcome, actor, created_at) VALUES (?, ?, ?, ?, ?)`,
      args: [jobId, "applied", "pending", "user", appliedIso],
    });

    // For advanced statuses, insert intermediate stage events on later dates
    const ladder = ["applied", "screening", "technical", "onsite", "offer", "accepted"];
    const idx = ladder.indexOf(status);
    if (idx > 0) {
      for (let j = 1; j <= idx; j++) {
        const stageDate = new Date(appliedDate);
        stageDate.setDate(stageDate.getDate() + j * (2 + Math.floor(Math.random() * 5)));
        if (stageDate > new Date()) continue;
        await client.execute({
          sql: `INSERT INTO stage_events (job_id, stage, outcome, actor, created_at) VALUES (?, ?, ?, ?, ?)`,
          args: [jobId, ladder[j], "pending", "user", stageDate.toISOString()],
        });
      }
    } else if (status === "rejected") {
      // Rejected jobs: applied event already inserted; add a rejection event a few days later
      const rejectDate = new Date(appliedDate);
      rejectDate.setDate(rejectDate.getDate() + 3 + Math.floor(Math.random() * 14));
      if (rejectDate <= new Date()) {
        await client.execute({
          sql: `INSERT INTO stage_events (job_id, stage, outcome, actor, created_at) VALUES (?, ?, ?, ?, ?)`,
          args: [jobId, "rejected", "failed", "user", rejectDate.toISOString()],
        });
      }
    }
  }

  console.log(`Done. Inserted ${TARGET} jobs.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
