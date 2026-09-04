import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  boardQueryKey,
  assignedTasksQueryKey,
  createTask,
  deleteTask,
  getProjectBoard,
  getAssignedTasks,
  getProjectTasks,
  getTask,
  taskQueryKey,
  tasksQueryKey,
  tasksQueryPrefix,
  updateTask,
  updateTaskStatus,
} from "../lib/tasks";
import type { Task, TaskFilters } from "../types/task";
import { projectActivityQueryPrefix } from "../lib/collaboration";

export const useProjectBoard = (projectId: string) =>
  useQuery({
    queryKey: boardQueryKey(projectId),
    queryFn: () => getProjectBoard(projectId),
    enabled: Boolean(projectId),
  });

export const useProjectTasks = (projectId: string, filters: TaskFilters = {}) =>
  useQuery({
    queryKey: tasksQueryKey(projectId, filters),
    queryFn: () => getProjectTasks(projectId, filters),
    enabled: Boolean(projectId),
    placeholderData: (previousData) => previousData,
  });

export const useTask = (taskId: string) =>
  useQuery({
    queryKey: taskQueryKey(taskId),
    queryFn: () => getTask(taskId),
    enabled: Boolean(taskId),
  });

export const useAssignedTasks = () =>
  useQuery({ queryKey: assignedTasksQueryKey, queryFn: getAssignedTasks });

const storeUpdatedTask = (
  queryClient: ReturnType<typeof useQueryClient>,
  task: Awaited<ReturnType<typeof getTask>>,
) => {
  queryClient.setQueryData(taskQueryKey(task.id), task);
  queryClient.setQueryData<Task[]>(tasksQueryKey(task.projectId), (currentTasks) => {
    if (!currentTasks) return currentTasks;
    const existingTask = currentTasks.some((currentTask) => currentTask.id === task.id);
    return existingTask
      ? currentTasks.map((currentTask) => currentTask.id === task.id ? task : currentTask)
      : [...currentTasks, task];
  });
  void queryClient.invalidateQueries({ queryKey: tasksQueryPrefix(task.projectId) });
  void queryClient.invalidateQueries({ queryKey: assignedTasksQueryKey, exact: true });
  void queryClient.invalidateQueries({ queryKey: projectActivityQueryPrefix(task.projectId) });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTask,
    onSuccess: (task) => storeUpdatedTask(queryClient, task),
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTask,
    onSuccess: (task) => storeUpdatedTask(queryClient, task),
  });
};

export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTaskStatus,
    onSuccess: (task) => storeUpdatedTask(queryClient, task),
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTask,
    onSuccess: (_response, { taskId, projectId }) => {
      queryClient.removeQueries({ queryKey: taskQueryKey(taskId), exact: true });
      queryClient.setQueryData<Task[]>(tasksQueryKey(projectId), (currentTasks) =>
        currentTasks?.filter((task) => task.id !== taskId),
      );
      void queryClient.invalidateQueries({ queryKey: tasksQueryPrefix(projectId) });
      void queryClient.invalidateQueries({ queryKey: assignedTasksQueryKey, exact: true });
      void queryClient.invalidateQueries({ queryKey: projectActivityQueryPrefix(projectId) });
    },
  });
};
