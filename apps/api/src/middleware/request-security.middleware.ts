import type { RequestHandler } from "express";
import { AppError } from "../utils/app-error.js";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

export const preventSensitiveResponseCaching: RequestHandler = (_request, response, next) => {
  response.setHeader("Cache-Control", "no-store");
  next();
};

export const requireJsonRequestBody: RequestHandler = (request, _response, next) => {
  if (safeMethods.has(request.method)) {
    next();
    return;
  }

  const contentLength = Number(request.get("content-length") ?? 0);
  const hasBody = contentLength > 0 || Boolean(request.get("transfer-encoding"));

  if (hasBody && !request.is(["application/json", "application/*+json"])) {
    next(new AppError(415, "UNSUPPORTED_MEDIA_TYPE", "Request body must use JSON."));
    return;
  }

  next();
};
