import { Router } from "express";
import { login, logout, me, register } from "../controllers/auth.controller.js";
import { authRateLimit } from "../middleware/auth-rate-limit.middleware.js";
import { requireAuthentication } from "../middleware/auth.middleware.js";

export const authRouter = Router();

authRouter.post("/register", authRateLimit, register);
authRouter.post("/login", authRateLimit, login);
authRouter.post("/logout", logout);
authRouter.get("/me", requireAuthentication, me);
