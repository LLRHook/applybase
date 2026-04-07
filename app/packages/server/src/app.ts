import { resolve, dirname } from "path";
import { existsSync } from "fs";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/error-handler.js";
import { requestContext } from "./middleware/request-context.js";
import { createRoutes } from "./routes/index.js";
import { tracerClickHandler } from "./routes/tracer.routes.js";
import type { DrizzleDB } from "./db/client.js";
import { getConfig } from "./lib/config.js";

export function createApp(db: DrizzleDB) {
  const app = express();

  const { nodeEnv, baseUrl } = getConfig();
  app.use(
    cors(
      nodeEnv === "production"
        ? { origin: baseUrl, credentials: true }
        : undefined,
    ),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(requestContext);

  app.use("/api", createRoutes(db));
  app.use(tracerClickHandler(db));

  // Serve client static files in production
  const publicDir = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "../../client/dist",
  );
  if (existsSync(publicDir)) {
    app.use(express.static(publicDir));
    app.get("*", (_req, res) => {
      res.sendFile(resolve(publicDir, "index.html"));
    });
  }

  app.use(errorHandler);

  return app;
}
