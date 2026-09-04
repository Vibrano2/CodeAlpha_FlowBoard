import { ActivityAction, Prisma, TaskStatus } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { prisma } from "../database/prisma.js";
import { AppError } from "../utils/app-error.js";
import type {
  CreateTaskInput,
  UpdateTaskInput,
} from "../validators/task.validators.js";
import { requireProjectMember } from "./project-access.service.js";

const userSummarySelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;

const taskSelect = {
  id: true,
  projectId: true,
  boardId: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  assigneeId: true,
  createdBy: true,
  dueDate: true,
  position: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
  assignee: { select: userSummarySelect },
  creator: { select: userSummarySelect },
  board: { select: { id: true, name: true } },
  project: { select: { id: true, name: true } },
  _count: { select: { comments: true } },
} satisfies Prisma.TaskSelect;

const normalizeDescription = (description: string | null | undefined) =>
  description === undefined ? undefined : description || null;

const requireAssigneeMembership = async (projectId: string, assigneeId: string) => {
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: assigneeId } },
    select: { id: true },
  });

  if (!membership) {
    throw new AppError(
      422,
      "INVALID_ASSIGNEE",
      "The assignee must be a member of this project.",
    );
  }
};

const loadAuthorizedTask = async (taskId: string, actorId: string) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: taskSelect,
  });

  if (!task) {
    throw new AppError(404, "TASK_NOT_FOUND", "Task was not found.");
  }

  await requireProjectMember(task.projectId, actorId);
  return task;
};

const mapMissingTask = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    throw new AppError(404, "TASK_NOT_FOUND", "Task was not found.");
  }

  throw error;
};

export const listProjectTasks = async (projectId: string, actorId: string) => {
  await requireProjectMember(projectId, actorId);

  return prisma.task.findMany({
    where: { projectId },
    orderBy: [{ status: "asc" }, { position: "asc" }, { createdAt: "asc" }],
    select: taskSelect,
  });
};

export const listAssignedTasks = (actorId: string) =>
  prisma.task.findMany({
    where: {
      assigneeId: actorId,
      project: { members: { some: { userId: actorId } } },
    },
    orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
    select: taskSelect,
  });

export const createProjectTask = async (
  projectId: string,
  actorId: string,
  input: CreateTaskInput,
) => {
  await requireProjectMember(projectId, actorId);

  const board = await prisma.board.findUnique({
    where: { projectId },
    select: { id: true },
  });

  if (!board) {
    throw new AppError(404, "BOARD_NOT_FOUND", "Project board was not found.");
  }

  if (input.assigneeId) {
    await requireAssigneeMembership(projectId, input.assigneeId);
  }

  const taskId = randomUUID();

  return prisma.$transaction(async (transaction) => {
    const latestPosition = await transaction.task.aggregate({
      where: { projectId, status: TaskStatus.TODO },
      _max: { position: true },
    });

    const task = await transaction.task.create({
      data: {
        id: taskId,
        projectId,
        boardId: board.id,
        title: input.title,
        description: normalizeDescription(input.description),
        priority: input.priority,
        assigneeId: input.assigneeId ?? null,
        createdBy: actorId,
        dueDate: input.dueDate ?? null,
        position: (latestPosition._max.position ?? -1) + 1,
      },
      select: taskSelect,
    });

    await transaction.activityLog.create({
      data: {
        projectId,
        taskId,
        actorId,
        action: ActivityAction.TASK_CREATED,
        metadata: { taskTitle: input.title },
      },
    });

    if (input.assigneeId) {
      await transaction.activityLog.create({
        data: {
          projectId,
          taskId,
          actorId,
          action: ActivityAction.TASK_ASSIGNED,
          metadata: { assigneeId: input.assigneeId },
        },
      });
    }

    return task;
  });
};

export const getTaskById = (taskId: string, actorId: string) =>
  loadAuthorizedTask(taskId, actorId);

export const updateTaskById = async (
  taskId: string,
  actorId: string,
  input: UpdateTaskInput,
) => {
  const existingTask = await loadAuthorizedTask(taskId, actorId);

  if (input.assigneeId) {
    await requireAssigneeMembership(existingTask.projectId, input.assigneeId);
  }

  const statusChanged = input.status !== undefined && input.status !== existingTask.status;
  const assigneeChanged =
    input.assigneeId !== undefined && input.assigneeId !== existingTask.assigneeId;

  try {
    return await prisma.$transaction(async (transaction) => {
      let destinationPosition = existingTask.position;

      if (statusChanged) {
        const latestPosition = await transaction.task.aggregate({
          where: { projectId: existingTask.projectId, status: input.status },
          _max: { position: true },
        });
        destinationPosition = (latestPosition._max.position ?? -1) + 1;
      }

      const data: Prisma.TaskUncheckedUpdateInput = {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined
          ? { description: normalizeDescription(input.description) }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
        ...(input.assigneeId !== undefined ? { assigneeId: input.assigneeId } : {}),
        ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
        ...(statusChanged ? { position: destinationPosition } : {}),
        ...(statusChanged
          ? { completedAt: input.status === TaskStatus.COMPLETED ? new Date() : null }
          : {}),
      };

      const updatedTask = await transaction.task.update({
        where: { id: taskId },
        data,
        select: taskSelect,
      });

      if (statusChanged) {
        await transaction.activityLog.create({
          data: {
            projectId: existingTask.projectId,
            taskId,
            actorId,
            action: ActivityAction.TASK_STATUS_CHANGED,
            metadata: { from: existingTask.status, to: input.status },
          },
        });

        if (input.status === TaskStatus.COMPLETED) {
          await transaction.activityLog.create({
            data: {
              projectId: existingTask.projectId,
              taskId,
              actorId,
              action: ActivityAction.TASK_COMPLETED,
            },
          });
        }
      }

      if (assigneeChanged && input.assigneeId) {
        await transaction.activityLog.create({
          data: {
            projectId: existingTask.projectId,
            taskId,
            actorId,
            action: ActivityAction.TASK_ASSIGNED,
            metadata: {
              previousAssigneeId: existingTask.assigneeId,
              assigneeId: input.assigneeId,
            },
          },
        });
      }

      return updatedTask;
    });
  } catch (error) {
    return mapMissingTask(error);
  }
};

export const deleteTaskById = async (taskId: string, actorId: string) => {
  await loadAuthorizedTask(taskId, actorId);

  try {
    await prisma.task.delete({ where: { id: taskId } });
  } catch (error) {
    mapMissingTask(error);
  }
};
