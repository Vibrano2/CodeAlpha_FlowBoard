import type { RequestHandler } from "express";
import {
  createProjectTask,
  deleteTaskById,
  getTaskById,
  listAssignedTasks as listAssignedTaskRecords,
  listProjectTasks,
  updateTaskById,
} from "../services/task.service.js";
import {
  createTaskSchema,
  listTasksQuerySchema,
  taskIdParamsSchema,
  taskProjectParamsSchema,
  updateTaskAssigneeSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from "../validators/task.validators.js";

export const listAssignedTasks: RequestHandler = async (request, response) => {
  const tasks = await listAssignedTaskRecords(request.authUser!.id);
  response.status(200).json({ success: true, data: { tasks } });
};

export const listTasks: RequestHandler = async (request, response) => {
  const { projectId } = taskProjectParamsSchema.parse(request.params);
  const filters = listTasksQuerySchema.parse(request.query);
  const tasks = await listProjectTasks(projectId, request.authUser!.id, filters);
  response.status(200).json({ success: true, data: { tasks } });
};

export const createTask: RequestHandler = async (request, response) => {
  const { projectId } = taskProjectParamsSchema.parse(request.params);
  const input = createTaskSchema.parse(request.body);
  const task = await createProjectTask(projectId, request.authUser!.id, input);
  response.status(201).json({ success: true, data: { task } });
};

export const getTask: RequestHandler = async (request, response) => {
  const { taskId } = taskIdParamsSchema.parse(request.params);
  const task = await getTaskById(taskId, request.authUser!.id);
  response.status(200).json({ success: true, data: { task } });
};

export const updateTask: RequestHandler = async (request, response) => {
  const { taskId } = taskIdParamsSchema.parse(request.params);
  const input = updateTaskSchema.parse(request.body);
  const task = await updateTaskById(taskId, request.authUser!.id, input);
  response.status(200).json({ success: true, data: { task } });
};

export const updateTaskStatus: RequestHandler = async (request, response) => {
  const { taskId } = taskIdParamsSchema.parse(request.params);
  const input = updateTaskStatusSchema.parse(request.body);
  const task = await updateTaskById(taskId, request.authUser!.id, input);
  response.status(200).json({ success: true, data: { task } });
};

export const updateTaskAssignee: RequestHandler = async (request, response) => {
  const { taskId } = taskIdParamsSchema.parse(request.params);
  const input = updateTaskAssigneeSchema.parse(request.body);
  const task = await updateTaskById(taskId, request.authUser!.id, input);
  response.status(200).json({ success: true, data: { task } });
};

export const deleteTask: RequestHandler = async (request, response) => {
  const { taskId } = taskIdParamsSchema.parse(request.params);
  await deleteTaskById(taskId, request.authUser!.id);
  response.status(200).json({
    success: true,
    data: { message: "Task deleted successfully." },
  });
};
