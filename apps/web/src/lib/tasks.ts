import type {
  Board,
  CreateTaskInput,
  Task,
  TaskStatus,
  UpdateTaskInput,
} from "../types/task";
import { apiRequest } from "./api";

interface TaskResponse {
  success: true;
  data: { task: Task };
}

export const boardQueryKey = (projectId: string) =>
  ["projects", projectId, "board"] as const;
export const tasksQueryKey = (projectId: string) =>
  ["projects", projectId, "tasks"] as const;
export const taskQueryKey = (taskId: string) => ["tasks", taskId] as const;
export const assignedTasksQueryKey = ["tasks", "assigned"] as const;

export const getProjectBoard = async (projectId: string) => {
  const response = await apiRequest<{ success: true; data: { board: Board } }>(
    `/projects/${projectId}/board`,
  );
  return response.data.board;
};

export const getProjectTasks = async (projectId: string) => {
  const response = await apiRequest<{ success: true; data: { tasks: Task[] } }>(
    `/projects/${projectId}/tasks`,
  );
  return response.data.tasks;
};

export const getAssignedTasks = async () => {
  const response = await apiRequest<{ success: true; data: { tasks: Task[] } }>("/tasks");
  return response.data.tasks;
};

export const createTask = async ({
  projectId,
  input,
}: {
  projectId: string;
  input: CreateTaskInput;
}) => {
  const response = await apiRequest<TaskResponse>(`/projects/${projectId}/tasks`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.data.task;
};

export const getTask = async (taskId: string) => {
  const response = await apiRequest<TaskResponse>(`/tasks/${taskId}`);
  return response.data.task;
};

export const updateTask = async ({
  taskId,
  input,
}: {
  taskId: string;
  projectId: string;
  input: UpdateTaskInput;
}) => {
  const response = await apiRequest<TaskResponse>(`/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return response.data.task;
};

export const updateTaskStatus = async ({
  taskId,
  status,
}: {
  taskId: string;
  projectId: string;
  status: TaskStatus;
}) => {
  const response = await apiRequest<TaskResponse>(`/tasks/${taskId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return response.data.task;
};

export const deleteTask = ({ taskId }: { taskId: string; projectId: string }) =>
  apiRequest<{ success: true; data: { message: string } }>(`/tasks/${taskId}`, {
    method: "DELETE",
  });
