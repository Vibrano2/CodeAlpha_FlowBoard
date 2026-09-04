import { ActivityAction, Prisma, ProjectRole } from "@prisma/client";
import { prisma } from "../database/prisma.js";
import { AppError } from "../utils/app-error.js";
import { requireProjectMember, requireProjectOwner } from "./project-access.service.js";

const memberSelect = {
  id: true,
  projectId: true,
  userId: true,
  role: true,
  joinedAt: true,
  user: {
    select: { id: true, name: true, email: true, avatarUrl: true },
  },
} satisfies Prisma.ProjectMemberSelect;

export const listProjectMembers = async (projectId: string, actorId: string) => {
  await requireProjectMember(projectId, actorId);

  return prisma.projectMember.findMany({
    where: { projectId },
    orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
    select: memberSelect,
  });
};

export const addProjectMember = async (
  projectId: string,
  actorId: string,
  userId: string,
) => {
  await requireProjectOwner(projectId, actorId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "User was not found.");
  }

  const existingMembership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    select: { id: true },
  });

  if (existingMembership) {
    throw new AppError(409, "ALREADY_A_MEMBER", "This user is already a project member.");
  }

  try {
    const [membership] = await prisma.$transaction([
      prisma.projectMember.create({
        data: { projectId, userId, role: ProjectRole.MEMBER },
        select: memberSelect,
      }),
      prisma.activityLog.create({
        data: {
          projectId,
          actorId,
          action: ActivityAction.MEMBER_ADDED,
          metadata: { memberId: userId },
        },
      }),
    ]);

    return membership;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError(409, "ALREADY_A_MEMBER", "This user is already a project member.");
    }

    throw error;
  }
};

export const removeProjectMember = async (
  projectId: string,
  actorId: string,
  userId: string,
) => {
  const project = await requireProjectOwner(projectId, actorId);

  if (project.ownerId === userId) {
    throw new AppError(400, "OWNER_REMOVAL_FORBIDDEN", "The project owner cannot be removed.");
  }

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    select: { id: true },
  });

  if (!membership) {
    throw new AppError(404, "MEMBER_NOT_FOUND", "Project member was not found.");
  }

  try {
    await prisma.$transaction([
      prisma.task.updateMany({
        where: { projectId, assigneeId: userId },
        data: { assigneeId: null },
      }),
      prisma.projectMember.delete({
        where: { projectId_userId: { projectId, userId } },
      }),
      prisma.activityLog.create({
        data: {
          projectId,
          actorId,
          action: ActivityAction.MEMBER_REMOVED,
          metadata: { memberId: userId },
        },
      }),
    ]);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new AppError(404, "MEMBER_NOT_FOUND", "Project member was not found.");
    }

    throw error;
  }
};
