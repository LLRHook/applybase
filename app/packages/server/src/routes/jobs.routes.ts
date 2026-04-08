import { Router } from "express";
import type { DrizzleDB } from "../db/client.js";
import { JobService } from "../services/job.service.js";
import { StageEventService } from "../services/stage-event.service.js";
import { ScraperService } from "../services/scraper.service.js";
import { validate } from "../middleware/validate.js";
import {
  createJobInputSchema,
  jobFiltersSchema,
  updateJobSchema,
  scrapeUrlSchema,
  checkDuplicateSchema,
  createStageEventSchema,
  renameResumeVariantSchema,
} from "@jobsearch/shared";

export function jobsRoutes(db: DrizzleDB) {
  const router = Router();
  const jobService = new JobService(db);
  const stageService = new StageEventService(db);
  const scraper = new ScraperService();

  // Scrape URL for auto-fill
  router.post("/scrape-url", validate(scrapeUrlSchema), async (req, res, next) => {
    try {
      const result = await scraper.scrapeUrl(req.body.url);
      res.json({ ok: true, data: result });
    } catch (err: any) {
      res.json({ ok: true, data: { title: undefined, employer: undefined, description: undefined } });
    }
  });

  // Create new application
  router.post("/", validate(createJobInputSchema), async (req, res, next) => {
    try {
      const job = await jobService.create(req.body);
      res.status(201).json({ ok: true, data: job });
    } catch (err) {
      next(err);
    }
  });

  // List with filters
  router.get("/", validate(jobFiltersSchema, "query"), async (req, res, next) => {
    try {
      const result = await jobService.list(req.query as any);
      res.json({ ok: true, data: result.jobs, meta: { total: result.total } });
    } catch (err) {
      next(err);
    }
  });

  // Export CSV
  router.get("/export", async (_req, res, next) => {
    try {
      const { jobs: allJobs } = await jobService.list({ limit: 5000 });
      const headers = ["Title", "Company", "Status", "Resume Used", "Found Via", "Location", "Salary Min", "Salary Max", "Currency", "Applied At", "URL"];
      const csvSafe = (val: string) => {
        let s = (val || "").replace(/"/g, '""');
        if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
        return `"${s}"`;
      };
      const rows = allJobs.map((j: any) => [
        csvSafe(j.title),
        csvSafe(j.employer),
        j.status,
        j.resumeUsed || "",
        j.foundVia || "",
        csvSafe(j.location),
        j.salaryMin || "",
        j.salaryMax || "",
        j.salaryCurrency || "",
        j.appliedAt || "",
        csvSafe(j.jobUrl),
      ]);
      const csv = [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=applications.csv");
      res.send(csv);
    } catch (err) {
      next(err);
    }
  });

  // Check duplicate
  // Cascade-rename a resume variant across every job that uses it.
  // Called by the Settings page when the user edits a variant label so existing
  // applications stay tagged with the new name.
  router.post("/rename-resume", validate(renameResumeVariantSchema), async (req, res, next) => {
    try {
      const result = await jobService.renameResumeVariant(req.body.from, req.body.to);
      res.json({ ok: true, data: result });
    } catch (err) {
      next(err);
    }
  });

  router.post("/check-duplicate", validate(checkDuplicateSchema), async (req, res, next) => {
    try {
      const { jobUrl, title, employer } = req.body;
      const duplicate = await jobService.checkDuplicate({ jobUrl, title, employer });
      res.json({ ok: true, data: duplicate });
    } catch (err) {
      next(err);
    }
  });

  // Follow-ups needing attention
  router.get("/follow-ups", async (_req, res, next) => {
    try {
      const followUps = await jobService.getFollowUps();
      res.json({ ok: true, data: followUps });
    } catch (err) {
      next(err);
    }
  });

  // Get detail
  router.get("/:id", async (req, res, next) => {
    try {
      const job = await jobService.getById(Number(req.params.id));
      res.json({ ok: true, data: job });
    } catch (err) {
      next(err);
    }
  });

  // Update any field
  router.patch("/:id", validate(updateJobSchema), async (req, res, next) => {
    try {
      const result = await jobService.update(Number(req.params.id), req.body);
      res.json({ ok: true, data: result });
    } catch (err) {
      next(err);
    }
  });

  // Delete
  router.delete("/:id", async (req, res, next) => {
    try {
      await jobService.delete(Number(req.params.id));
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

  // Stage events
  router.get("/:id/stage-events", async (req, res, next) => {
    try {
      const events = await stageService.listByJob(Number(req.params.id));
      res.json({ ok: true, data: events });
    } catch (err) {
      next(err);
    }
  });

  router.post("/:id/stage-events", validate(createStageEventSchema), async (req, res, next) => {
    try {
      const event = await stageService.create({
        ...req.body,
        jobId: Number(req.params.id),
      });
      res.json({ ok: true, data: event });
    } catch (err) {
      next(err);
    }
  });

  // Mark followed up
  router.post("/:id/follow-up", async (req, res, next) => {
    try {
      await jobService.markFollowedUp(Number(req.params.id));
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
