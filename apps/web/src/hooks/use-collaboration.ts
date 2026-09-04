import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  activityQueryKey,
  commentsQueryKey,
  createComment,
  deleteComment,
  getProjectActivity,
  getTaskComments,
  projectActivityQueryPrefix,
  updateComment,
} from "../lib/collaboration";
import { taskQueryKey, tasksQueryKey } from "../lib/tasks";
import type { Comment } from "../types/collaboration";
import type { Task } from "../types/task";

export const useTaskComments = (taskId: string) =>
  useQuery({
    queryKey: commentsQueryKey(taskId),
    queryFn: () => getTaskComments(taskId),
    enabled: Boolean(taskId),
  });

export const useProjectActivity = (projectId: string, taskId?: string) =>
  useQuery({
    queryKey: activityQueryKey(projectId, taskId),
    queryFn: () => getProjectActivity(projectId, taskId),
    enabled: Boolean(projectId),
  });

const invalidateActivity = (
  queryClient: ReturnType<typeof useQueryClient>,
  projectId: string,
) => void queryClient.invalidateQueries({ queryKey: projectActivityQueryPrefix(projectId) });

const adjustCommentCount = (
  queryClient: ReturnType<typeof useQueryClient>,
  taskId: string,
  projectId: string,
  adjustment: number,
) => {
  const adjust = (task: Task) => ({
    ...task,
    _count: { comments: Math.max(0, task._count.comments + adjustment) },
  });

  queryClient.setQueryData<Task>(taskQueryKey(taskId), (task) => task ? adjust(task) : task);
  queryClient.setQueryData<Task[]>(tasksQueryKey(projectId), (tasks) =>
    tasks?.map((task) => task.id === taskId ? adjust(task) : task),
  );
};

export const useCreateComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createComment,
    onSuccess: (comment, { taskId, projectId }) => {
      queryClient.setQueryData<Comment[]>(commentsQueryKey(taskId), (comments) =>
        comments ? [...comments, comment] : [comment],
      );
      adjustCommentCount(queryClient, taskId, projectId, 1);
      invalidateActivity(queryClient, projectId);
    },
  });
};

export const useUpdateComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateComment,
    onSuccess: (comment, { taskId }) => {
      queryClient.setQueryData<Comment[]>(commentsQueryKey(taskId), (comments) =>
        comments?.map((current) => current.id === comment.id ? comment : current),
      );
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteComment,
    onSuccess: (_response, { commentId, taskId, projectId }) => {
      queryClient.setQueryData<Comment[]>(commentsQueryKey(taskId), (comments) =>
        comments?.filter((comment) => comment.id !== commentId),
      );
      adjustCommentCount(queryClient, taskId, projectId, -1);
    },
  });
};
