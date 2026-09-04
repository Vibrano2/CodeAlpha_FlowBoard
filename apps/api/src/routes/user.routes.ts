import { Router } from "express";
import {
  getCurrentUserProfile,
  searchUsers,
  updateCurrentUserProfile,
} from "../controllers/user.controller.js";
import { requireAuthentication } from "../middleware/auth.middleware.js";

export const userRouter = Router();

userRouter.use(requireAuthentication);
userRouter.route("/me").get(getCurrentUserProfile).patch(updateCurrentUserProfile);
userRouter.get("/search", searchUsers);
