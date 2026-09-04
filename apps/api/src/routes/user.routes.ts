import { Router } from "express";
import { searchUsers } from "../controllers/user.controller.js";
import { requireAuthentication } from "../middleware/auth.middleware.js";

export const userRouter = Router();

userRouter.use(requireAuthentication);
userRouter.get("/search", searchUsers);
