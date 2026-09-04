import type { RequestHandler } from "express";
import { env } from "../config/env.js";
import { getUserById } from "../services/auth.service.js";
import { clearAuthCookie } from "../utils/auth-cookie.js";
import { AppError } from "../utils/app-error.js";
import { verifyAuthToken } from "../utils/auth-token.js";

export const requireAuthentication: RequestHandler = async (
  request,
  response,
  next,
) => {
  const token = request.cookies[env.authCookieName] as string | undefined;

  if (!token) {
    next(new AppError(401, "UNAUTHENTICATED", "Authentication is required."));
    return;
  }

  try {
    const { sub } = verifyAuthToken(token);
    const user = await getUserById(sub);

    if (!user) {
      throw new Error("Authenticated user was not found.");
    }

    request.authUser = user;
    next();
  } catch {
    clearAuthCookie(response);
    next(new AppError(401, "UNAUTHENTICATED", "Authentication is required."));
  }
};
