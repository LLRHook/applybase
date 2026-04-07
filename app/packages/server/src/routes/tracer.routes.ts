import { Router } from "express";
import type { DrizzleDB } from "../db/client.js";
import { TracerService } from "../services/tracer.service.js";
import { validate } from "../middleware/validate.js";
import { createTracerLinkSchema } from "@jobsearch/shared";

export function tracerRoutes(db: DrizzleDB) {
  const router = Router();
  const service = new TracerService(db);

  // Generate a tracer link
  router.post("/links", validate(createTracerLinkSchema), async (req, res, next) => {
    try {
      const { jobId, originalUrl, label } = req.body;
      const link = await service.generateLink(jobId, originalUrl, label);
      res.json({ ok: true, data: link });
    } catch (err) {
      next(err);
    }
  });

  // Get clicks for a job
  router.get("/links/job/:jobId", async (req, res, next) => {
    try {
      const clicks = await service.getClicksByJob(Number(req.params.jobId));
      res.json({ ok: true, data: clicks });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

// Click redirect handler (mounted at root, not under /api)
export function tracerClickHandler(db: DrizzleDB) {
  const router = Router();
  const service = new TracerService(db);

  router.get("/t/:token", async (req, res) => {
    const ip = (req.headers["x-forwarded-for"] as string) || req.ip || "unknown";
    const ua = req.headers["user-agent"] || "unknown";
    const originalUrl = await service.handleClick(req.params.token, ip, ua);

    if (!originalUrl) {
      res.status(404).send("Not found");
      return;
    }

    res.redirect(302, originalUrl);
  });

  return router;
}
