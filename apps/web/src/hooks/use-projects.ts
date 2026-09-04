import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProject,
  deleteProject,
  getProject,
  getProjects,
  projectQueryKey,
  projectsQueryKey,
  updateProject,
} from "../lib/projects";

export const useProjects = () =>
  useQuery({ queryKey: projectsQueryKey, queryFn: getProjects });

export const useProject = (projectId: string) =>
  useQuery({
    queryKey: projectQueryKey(projectId),
    queryFn: () => getProject(projectId),
    enabled: Boolean(projectId),
  });

export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProject,
    onSuccess: (project) => {
      queryClient.setQueryData(projectQueryKey(project.id), project);
      void queryClient.invalidateQueries({ queryKey: projectsQueryKey, exact: true });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProject,
    onSuccess: (project) => {
      queryClient.setQueryData(projectQueryKey(project.id), project);
      void queryClient.invalidateQueries({ queryKey: projectsQueryKey, exact: true });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProject,
    onSuccess: (_response, projectId) => {
      queryClient.removeQueries({ queryKey: projectQueryKey(projectId), exact: true });
      void queryClient.invalidateQueries({ queryKey: projectsQueryKey, exact: true });
    },
  });
};
