import type { CookieOptions, Response } from "express";
import { env } from "../config/env.js";

const tokenMaxAge = {
  "1d": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
} as const;

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  // The production web app and API are hosted on different sites. SameSite=None
  // is therefore required for credentialed API requests and Socket.io handshakes.
  sameSite: env.nodeEnv === "production" ? "none" : "lax",
  secure: env.nodeEnv === "production",
  path: "/",
};

export const setAuthCookie = (response: Response, token: string) => {
  response.cookie(env.authCookieName, token, {
    ...baseCookieOptions,
    maxAge: tokenMaxAge[env.authTokenTtl],
  });
};

export const clearAuthCookie = (response: Response) => {
  response.clearCookie(env.authCookieName, baseCookieOptions);
};
