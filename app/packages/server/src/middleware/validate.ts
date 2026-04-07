import type { RequestHandler } from "express";
import type { ZodSchema } from "zod";

export function validate(schema: ZodSchema, source: "body" | "query" = "body"): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      res.status(400).json({
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: result.error.issues.map((i) => i.message).join(", "),
          details: result.error.issues,
        },
      });
      return;
    }
    req[source] = result.data;
    next();
  };
}
