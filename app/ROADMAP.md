# Roadmap

Features that have been designed or partially scoped but are **not in the shipping codebase**. They live here so the intent isn't lost — pick them up if they become useful.

## Post-application email capture

**What:** Ingest emails from recruiters (rejections, interview invites, offers) and automatically tie them to the matching job. Suggested auto-transition of status when the email signal is strong (e.g. "we'd like to schedule..." → technical).

**Prior state:** Two Drizzle tables (`post_application_messages`, `post_application_integrations`) were scaffolded with a full Gmail-inspired schema — threadId, classification, processingStatus, stageTarget. They were dropped in migration `0002_chemical_karma.sql` because nothing read or wrote to them. The shared type `PostApplicationMessage` and the `JobDetail.emails` array were removed with them.

**To pick up again:**
1. Bring back the tables as a fresh migration (the SQL from `0000_orange_iron_man.sql` is a good starting point — lines 43–60).
2. Add an `ImapPoller` or Gmail-API integration in `packages/server/src/services/` that runs on a schedule or a manual trigger.
3. Build a classifier — cheapest is keyword-matching against common phrases; nicer is a small LLM pass.
4. Add the `emails` array back to `JobDetail` and render it in a new tab on the Application Detail page.
5. Consider a "pending review" UI where ambiguous matches surface for manual resolution before they auto-transition the job's status.

## Generalized integrations / webhook sync

**What:** Let the user mirror their application state to an external system — Notion, Airtable, a Google Sheet, a Discord webhook, a personal server. Every status change fires an outbound event.

**Prior state:** The `post_application_integrations` table had provider/credentials fields. No routes, no service, no UI. Also dropped in migration `0002`.

**To pick up again:**
1. Decide on a single direction first (outbound-only is much simpler than bidirectional).
2. A webhook emitter is the cheapest path: on every status transition in `JobService.update()`, fire a POST to a user-configured URL with `{ jobId, oldStatus, newStatus, timestamp }`.
3. Settings page gets a "Webhooks" panel with URL + secret, plus a "Send test event" button.

## Profile, skills, projects, and target-roles management

**What:** A view + edit UI for the engineer's "about me" data — personal facts (name, location, work auth, languages, education), the full skills inventory grouped by category, the portfolio of projects with stack/tagline/links, and a list of target roles with title variants and salary ranges.

**Prior state:** A markdown importer (`importers/markdown-importer.ts` plus 5 parser files) ingested this data from sibling files at `../Profile/*.md` and `../Applications/target-roles.md`. Four DB tables (`profile_personal`, `profile_skills`, `profile_projects`, `target_roles`) stored it, and four `/api/profile/*` routes exposed it. **Nothing in the client ever consumed any of it** — the data was loaded into the DB and then read by no one.

The whole feature was deleted because (a) the importer's hardcoded relative paths to a parent directory were a structural PII risk, and (b) the unused tables and routes were dead surface area. Migration `0003_long_impossible_man.sql` drops the four tables. Files removed:
- `packages/server/src/importers/` (entire directory, 6 files)
- `packages/server/src/db/tables/profile.ts`
- `packages/server/src/db/tables/target-roles.ts`
- `packages/server/src/routes/profile.routes.ts`
- `packages/shared/src/types/profile.ts`

**To pick up again:**
1. Decide on the source of truth: UI-edited DB rows, or markdown files the user owns and the app reads.
2. If UI-edited: bring back the four tables in a fresh migration, recreate the routes, and add a Profile page to the client sidebar with view + inline edit modes for each section.
3. If markdown-based: bring back the importer but make the source path configurable in Settings (file picker), document the expected markdown schema, and ship sample files in `examples/profile/`. Add a "Re-import" button so users can refresh after editing the source files.
4. Either way, decide whether the resume `pdf` mode should consume this data — i.e., does the tracker hold the canonical "about me" that flows into LaTeX, or are the two separate?

## Scraper resilience per-source

**What:** `scraper.service.ts` parses JSON-LD or standard `og:` meta tags via cheerio. It works for pages that have structured data (most modern ATS systems) and silently returns partial results for pages that don't (older career pages, custom HTML).

**To pick up again:**
1. Add per-source scrapers in `packages/server/src/services/scrapers/` with a common interface: `{ matches(url): boolean, scrape(html): Partial<CreateJobInput> }`.
2. Plausible first targets: Greenhouse (`greenhouse.io`), Lever (`lever.co`), Ashby (`ashbyhq.com`), Workday.
3. The main `scraper.service.ts` becomes a dispatcher: try the matching per-source scraper first, fall back to the generic JSON-LD/meta extractor.
4. Surface "scrape quality" in the UI: a confidence badge on the AddApplication form showing which fields were extracted reliably vs guessed.

## Auto-scrape on URL paste

**What:** Currently the user pastes a URL and has to click "Scrape." Small UX nit: the button exists, but the scrape should fire automatically when a URL is pasted into a visibly-empty form. A keyboard shortcut (Cmd+Enter) to trigger scrape would also be nice.

**To pick up again:**
1. In `AddApplication.tsx`, add an `onPaste` handler on the URL input that debounces ~300ms and then calls the scraper if all other fields are empty.
2. Show a spinner in the URL input instead of a separate button state.
3. Bonus: detect which ATS the URL is from and show a hint ("Detected: Greenhouse posting") before the scrape completes.

## Tests

**What:** The codebase has zero automated tests. For a tool that manages real job-search data, this is a gap worth closing before a wider audience picks it up.

**To pick up again:**
1. Start with integration tests on the server routes using `vitest` + `supertest` + an in-memory libsql DB. Each test seeds a fresh DB and tears down. The existing `drizzle` migrations make this trivial.
2. Priority order: `jobs.routes.ts` (CRUD + status transitions), `analytics.service.ts` (the dashboard metrics), `scraper.service.ts` (with cheerio fixtures from real job pages).
3. Client tests are lower priority — the pages are thin wrappers around `@tanstack/react-query`, so E2E tests via Playwright would give more signal per hour invested than unit tests.
