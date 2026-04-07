import type { RequestHandler } from "express";
import { nanoid } from "nanoid";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

export const requestContext: RequestHandler = (req, _res, next) => {
  req.requestId = (req.headers["x-request-id"] as string) || nanoid(10);
  next();
};
