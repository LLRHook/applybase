import { Router } from "express";
import type { DrizzleDB } from "../db/client.js";
import { AnalyticsService } from "../services/analytics.service.js";

export function analyticsRoutes(db: DrizzleDB) {
  const router = Router();
  const service = new AnalyticsService(db);

  router.get("/dashboard", async (_req, res, next) => {
    try {
      const metrics = await service.getDashboard();
      res.json({ ok: true, data: metrics });
    } catch (err) {
      next(err);
    }
  });

  router.get("/funnel", async (_req, res, next) => {
    try {
      const funnel = await service.getFunnel();
      res.json({ ok: true, data: funnel });
    } catch (err) {
      next(err);
    }
  });

  router.get("/resume", async (_req, res, next) => {
    try {
      const stats = await service.getResumeEffectiveness();
      res.json({ ok: true, data: stats });
    } catch (err) {
      next(err);
    }
  });

  router.get("/sources", async (_req, res, next) => {
    try {
      const stats = await service.getSourceStats();
      res.json({ ok: true, data: stats });
    } catch (err) {
      next(err);
    }
  });

  router.get("/velocity", async (_req, res, next) => {
    try {
      const data = await service.getVelocity();
      res.json({ ok: true, data });
    } catch (err) {
      next(err);
    }
  });

  router.get("/activity", async (_req, res, next) => {
    try {
      const data = await service.getRecentActivity();
      res.json({ ok: true, data });
    } catch (err) {
      next(err);
    }
  });

  router.get("/heatmap", async (_req, res, next) => {
    try {
      const data = await service.getHeatmap();
      res.json({ ok: true, data });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
