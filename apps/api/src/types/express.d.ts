import type { SafeUser } from "./auth.js";

declare global {
  namespace Express {
    interface Request {
      authUser?: SafeUser;
    }
  }
}

export {};
