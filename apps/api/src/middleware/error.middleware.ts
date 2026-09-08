import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _request,
  response,
  _next,
) => {
  if (typeof error === "object" && error !== null && "type" in error) {
    if (error.type === "entity.parse.failed") {
      response.status(400).json({
        success: false,
        error: { code: "INVALID_JSON", message: "Request body contains invalid JSON." },
      });
      return;
    }

    if (error.type === "entity.too.large") {
      response.status(413).json({
        success: false,
        error: { code: "PAYLOAD_TOO_LARGE", message: "Request body is too large." },
      });
      return;
    }
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    });
    return;
  }

  if (error instanceof ZodError) {
    response.status(422).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "The request contains invalid data.",
        details: error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
    });
    return;
  }

  if (env.nodeEnv !== "production") {
    console.error(error);
  }

  response.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred.",
    },
  });
};
