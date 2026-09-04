import type { ProjectMember, UserSearchResult } from "../types/project";
import { apiRequest } from "./api";

export const membersQueryKey = (projectId: string) => ["projects", projectId, "members"] as const;
export const userSearchQueryKey = (email: string) => ["users", "search", email] as const;

export const getProjectMembers = async (projectId: string) => {
  const response = await apiRequest<{ success: true; data: { members: ProjectMember[] } }>(
    `/projects/${projectId}/members`,
  );
  return response.data.members;
};

export const searchUsers = async (email: string) => {
  const response = await apiRequest<{ success: true; data: { users: UserSearchResult[] } }>(
    `/users/search?email=${encodeURIComponent(email)}`,
  );
  return response.data.users;
};

export const addProjectMember = async ({ projectId, userId }: { projectId: string; userId: string }) => {
  const response = await apiRequest<{ success: true; data: { member: ProjectMember } }>(
    `/projects/${projectId}/members`,
    { method: "POST", body: JSON.stringify({ userId }) },
  );
  return response.data.member;
};

export const removeProjectMember = ({ projectId, userId }: { projectId: string; userId: string }) =>
  apiRequest<{ success: true; data: { message: string } }>(
    `/projects/${projectId}/members/${userId}`,
    { method: "DELETE" },
  );
