import { Router } from "express";
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject,
} from "../controllers/project.controller.js";
import { requireAuthentication } from "../middleware/auth.middleware.js";

export const projectRouter = Router();

projectRouter.use(requireAuthentication);
projectRouter.route("/").get(listProjects).post(createProject);
projectRouter.route("/:projectId").get(getProject).patch(updateProject).delete(deleteProject);
