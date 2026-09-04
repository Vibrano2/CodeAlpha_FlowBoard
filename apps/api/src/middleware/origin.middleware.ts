import type { RequestHandler } from "express";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

export const verifyRequestOrigin: RequestHandler = (request, _response, next) => {
  if (safeMethods.has(request.method)) {
    next();
    return;
  }

  const origin = request.get("origin");

  if (origin && !env.clientOrigins.includes(origin)) {
    next(new AppError(403, "INVALID_ORIGIN", "This request origin is not allowed."));
    return;
  }

  next();
};
