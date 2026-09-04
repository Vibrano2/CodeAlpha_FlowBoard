import { Router } from "express";
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject,
} from "../controllers/project.controller.js";
import { requireAuthentication } from "../middleware/auth.middleware.js";
import { memberRouter } from "./member.routes.js";

export const projectRouter = Router();

projectRouter.use(requireAuthentication);
projectRouter.route("/").get(listProjects).post(createProject);
projectRouter.use("/:projectId/members", memberRouter);
projectRouter.route("/:projectId").get(getProject).patch(updateProject).delete(deleteProject);
