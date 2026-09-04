import type { RequestHandler } from "express";
import {
  createProject as createProjectRecord,
  deleteProject as deleteProjectRecord,
  getProjectById,
  listProjects as listProjectRecords,
  updateProject as updateProjectRecord,
} from "../services/project.service.js";
import {
  createProjectSchema,
  projectIdParamsSchema,
  updateProjectSchema,
} from "../validators/project.validators.js";

export const listProjects: RequestHandler = async (request, response) => {
  const projects = await listProjectRecords(request.authUser!.id);
  response.status(200).json({ success: true, data: { projects } });
};

export const createProject: RequestHandler = async (request, response) => {
  const input = createProjectSchema.parse(request.body);
  const project = await createProjectRecord(request.authUser!.id, input);
  response.status(201).json({
    success: true,
    data: { project: { ...project, currentUserRole: "OWNER" } },
  });
};

export const getProject: RequestHandler = async (request, response) => {
  const { projectId } = projectIdParamsSchema.parse(request.params);
  const project = await getProjectById(projectId, request.authUser!.id);
  response.status(200).json({ success: true, data: { project } });
};

export const updateProject: RequestHandler = async (request, response) => {
  const { projectId } = projectIdParamsSchema.parse(request.params);
  const input = updateProjectSchema.parse(request.body);
  const project = await updateProjectRecord(projectId, request.authUser!.id, input);
  response.status(200).json({
    success: true,
    data: { project: { ...project, currentUserRole: "OWNER" } },
  });
};

export const deleteProject: RequestHandler = async (request, response) => {
  const { projectId } = projectIdParamsSchema.parse(request.params);
  await deleteProjectRecord(projectId, request.authUser!.id);
  response.status(200).json({
    success: true,
    data: { message: "Project deleted successfully." },
  });
};
