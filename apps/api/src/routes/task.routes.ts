import { Router } from "express";
import {
  deleteTask,
  getTask,
  listAssignedTasks,
  updateTask,
  updateTaskAssignee,
  updateTaskStatus,
} from "../controllers/task.controller.js";
import { requireAuthentication } from "../middleware/auth.middleware.js";
import { createComment, listComments } from "../controllers/comment.controller.js";

export const taskRouter = Router();

taskRouter.use(requireAuthentication);
taskRouter.get("/", listAssignedTasks);
taskRouter.route("/:taskId/comments").get(listComments).post(createComment);
taskRouter.route("/:taskId").get(getTask).patch(updateTask).delete(deleteTask);
taskRouter.patch("/:taskId/status", updateTaskStatus);
taskRouter.patch("/:taskId/assignee", updateTaskAssignee);
