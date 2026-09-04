import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addProjectMember,
  getProjectMembers,
  membersQueryKey,
  removeProjectMember,
  searchUsers,
  userSearchQueryKey,
} from "../lib/members";
import { projectQueryKey, projectsQueryKey } from "../lib/projects";

export const useProjectMembers = (projectId: string) =>
  useQuery({
    queryKey: membersQueryKey(projectId),
    queryFn: () => getProjectMembers(projectId),
    enabled: Boolean(projectId),
  });

export const useUserSearch = (email: string) =>
  useQuery({
    queryKey: userSearchQueryKey(email),
    queryFn: () => searchUsers(email),
    enabled: email.length >= 3,
    staleTime: 30_000,
  });

const invalidateProjectMembership = (
  queryClient: ReturnType<typeof useQueryClient>,
  projectId: string,
) => {
  void queryClient.invalidateQueries({ queryKey: membersQueryKey(projectId), exact: true });
  void queryClient.invalidateQueries({ queryKey: projectQueryKey(projectId), exact: true });
  void queryClient.invalidateQueries({ queryKey: projectsQueryKey, exact: true });
};

export const useAddProjectMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addProjectMember,
    onSuccess: (_member, { projectId }) => invalidateProjectMembership(queryClient, projectId),
  });
};

export const useRemoveProjectMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeProjectMember,
    onSuccess: (_response, { projectId }) => invalidateProjectMembership(queryClient, projectId),
  });
};
