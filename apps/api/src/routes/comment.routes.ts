import { Router } from "express";
import { deleteComment, updateComment } from "../controllers/comment.controller.js";
import { requireAuthentication } from "../middleware/auth.middleware.js";

export const commentRouter = Router();

commentRouter.use(requireAuthentication);
commentRouter.route("/:commentId").patch(updateComment).delete(deleteComment);
