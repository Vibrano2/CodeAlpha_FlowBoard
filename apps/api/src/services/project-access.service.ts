import { prisma } from "../database/prisma.js";
import { AppError } from "../utils/app-error.js";

export const requireProjectMember = async (projectId: string, userId: string) => {
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    select: {
      role: true,
      project: { select: { id: true, name: true, ownerId: true } },
    },
  });

  if (!membership) {
    throw new AppError(404, "PROJECT_NOT_FOUND", "Project was not found.");
  }

  return membership;
};

export const requireProjectOwner = async (projectId: string, userId: string) => {
  const membership = await requireProjectMember(projectId, userId);

  if (membership.role !== "OWNER" || membership.project.ownerId !== userId) {
    throw new AppError(403, "OWNER_REQUIRED", "Only the project owner can perform this action.");
  }

  return membership.project;
};
