import { Router } from "express";
import { SettingsService } from "../services/settings.service.js";
import type { DrizzleDB } from "../db/client.js";
import { validate } from "../middleware/validate.js";
import { updateSettingsSchema } from "@jobsearch/shared";

export function settingsRoutes(db: DrizzleDB) {
  const router = Router();
  const service = new SettingsService(db);

  router.get("/", async (_req, res, next) => {
    try {
      const all = await service.getAll();
      res.json({ ok: true, data: all });
    } catch (err) {
      next(err);
    }
  });

  router.patch("/", validate(updateSettingsSchema), async (req, res, next) => {
    try {
      await service.setMany(req.body);
      const all = await service.getAll();
      res.json({ ok: true, data: all });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
