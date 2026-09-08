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
  const fetchSite = request.get("sec-fetch-site");
  const isTrustedOrigin = origin ? env.clientOrigins.includes(origin) : false;

  if ((origin && !isTrustedOrigin) || (fetchSite === "cross-site" && !isTrustedOrigin)) {
    next(new AppError(403, "INVALID_ORIGIN", "This request origin is not allowed."));
    return;
  }

  next();
};
