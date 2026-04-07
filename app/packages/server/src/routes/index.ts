import { Router } from "express";
import type { DrizzleDB } from "../db/client.js";
import { settingsRoutes } from "./settings.routes.js";
import { jobsRoutes } from "./jobs.routes.js";
import { analyticsRoutes } from "./analytics.routes.js";
import { tracerRoutes } from "./tracer.routes.js";

export function createRoutes(db: DrizzleDB) {
  const router = Router();

  router.get("/health", (_req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
  });

  router.use("/settings", settingsRoutes(db));
  router.use("/jobs", jobsRoutes(db));
  router.use("/analytics", analyticsRoutes(db));
  router.use("/tracer", tracerRoutes(db));

  return router;
}
