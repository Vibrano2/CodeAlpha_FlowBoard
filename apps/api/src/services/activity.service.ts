import { Prisma } from "@prisma/client";
import { prisma } from "../database/prisma.js";
import { AppError } from "../utils/app-error.js";
import { requireProjectMember } from "./project-access.service.js";

const activitySelect = {
  id: true,
  projectId: true,
  taskId: true,
  actorId: true,
  action: true,
  metadata: true,
  createdAt: true,
  actor: {
    select: { id: true, name: true, email: true, avatarUrl: true },
  },
  task: { select: { id: true, title: true } },
} satisfies Prisma.ActivityLogSelect;

export const listProjectActivity = async (
  projectId: string,
  actorId: string,
  taskId?: string,
) => {
  await requireProjectMember(projectId, actorId);

  if (taskId) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, projectId },
      select: { id: true },
    });

    if (!task) {
      throw new AppError(404, "TASK_NOT_FOUND", "Task was not found.");
    }
  }

  return prisma.activityLog.findMany({
    where: { projectId, ...(taskId ? { taskId } : {}) },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: activitySelect,
  });
};
