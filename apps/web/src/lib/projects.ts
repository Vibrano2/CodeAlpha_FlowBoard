import type { Project, ProjectInput } from "../types/project";
import { apiRequest } from "./api";

interface ProjectResponse {
  success: true;
  data: { project: Project };
}

interface ProjectsResponse {
  success: true;
  data: { projects: Project[] };
}

export const projectsQueryKey = ["projects"] as const;
export const projectQueryKey = (projectId: string) => ["projects", projectId] as const;

export const getProjects = async () => {
  const response = await apiRequest<ProjectsResponse>("/projects");
  return response.data.projects;
};

export const getProject = async (projectId: string) => {
  const response = await apiRequest<ProjectResponse>(`/projects/${projectId}`);
  return response.data.project;
};

export const createProject = async (input: ProjectInput) => {
  const response = await apiRequest<ProjectResponse>("/projects", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.data.project;
};

export const updateProject = async ({ projectId, input }: { projectId: string; input: ProjectInput }) => {
  const response = await apiRequest<ProjectResponse>(`/projects/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return response.data.project;
};

export const deleteProject = (projectId: string) =>
  apiRequest<{ success: true; data: { message: string } }>(`/projects/${projectId}`, {
    method: "DELETE",
  });
