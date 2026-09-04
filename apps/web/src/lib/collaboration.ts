import type { Activity, Comment } from "../types/collaboration";
import { apiRequest } from "./api";

export const commentsQueryKey = (taskId: string) => ["tasks", taskId, "comments"] as const;
export const activityQueryKey = (projectId: string, taskId?: string) =>
  ["projects", projectId, "activity", taskId ?? "all"] as const;
export const projectActivityQueryPrefix = (projectId: string) =>
  ["projects", projectId, "activity"] as const;

export const getTaskComments = async (taskId: string) => {
  const response = await apiRequest<{ success: true; data: { comments: Comment[] } }>(
    `/tasks/${taskId}/comments`,
  );
  return response.data.comments;
};

export const createComment = async ({ taskId, content }: { taskId: string; projectId: string; content: string }) => {
  const response = await apiRequest<{ success: true; data: { comment: Comment } }>(
    `/tasks/${taskId}/comments`,
    { method: "POST", body: JSON.stringify({ content }) },
  );
  return response.data.comment;
};

export const updateComment = async ({ commentId, content }: { commentId: string; taskId: string; projectId: string; content: string }) => {
  const response = await apiRequest<{ success: true; data: { comment: Comment } }>(
    `/comments/${commentId}`,
    { method: "PATCH", body: JSON.stringify({ content }) },
  );
  return response.data.comment;
};

export const deleteComment = ({ commentId }: { commentId: string; taskId: string; projectId: string }) =>
  apiRequest<{ success: true; data: { message: string } }>(`/comments/${commentId}`, {
    method: "DELETE",
  });

export const getProjectActivity = async (projectId: string, taskId?: string) => {
  const query = taskId ? `?taskId=${encodeURIComponent(taskId)}` : "";
  const response = await apiRequest<{ success: true; data: { activities: Activity[] } }>(
    `/projects/${projectId}/activity${query}`,
  );
  return response.data.activities;
};
