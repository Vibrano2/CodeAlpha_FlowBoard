import { ActivityAction, Prisma, ProjectRole } from "@prisma/client";
import { prisma } from "../database/prisma.js";
import { AppError } from "../utils/app-error.js";
import type { CreateProjectInput, UpdateProjectInput } from "../validators/project.validators.js";
import { requireProjectMember, requireProjectOwner } from "./project-access.service.js";

const ownerSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;

const projectDetailSelect = {
  id: true,
  name: true,
  description: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
  owner: { select: ownerSelect },
  board: {
    select: { id: true, name: true, createdAt: true, updatedAt: true },
  },
  _count: { select: { members: true } },
} satisfies Prisma.ProjectSelect;

const normalizeDescription = (description: string | null | undefined) =>
  description === undefined ? undefined : description || null;

export const listProjects = async (userId: string) => {
  const projects = await prisma.project.findMany({
    where: { members: { some: { userId } } },
    orderBy: { updatedAt: "desc" },
    select: {
      ...projectDetailSelect,
      members: {
        where: { userId },
        select: { role: true },
        take: 1,
      },
    },
  });

  return projects.map(({ members, ...project }) => ({
    ...project,
    currentUserRole: members[0]?.role ?? ProjectRole.MEMBER,
  }));
};

export const createProject = (userId: string, input: CreateProjectInput) =>
  prisma.project.create({
    data: {
      name: input.name,
      description: normalizeDescription(input.description),
      ownerId: userId,
      members: {
        create: { userId, role: ProjectRole.OWNER },
      },
      board: {
        create: { name: "Project Board" },
      },
      activities: {
        create: {
          actorId: userId,
          action: ActivityAction.PROJECT_CREATED,
        },
      },
    },
    select: projectDetailSelect,
  });

export const getProjectById = async (projectId: string, userId: string) => {
  const membership = await requireProjectMember(projectId, userId);
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: projectDetailSelect,
  });

  if (!project) {
    throw new AppError(404, "PROJECT_NOT_FOUND", "Project was not found.");
  }

  return { ...project, currentUserRole: membership.role };
};

export const updateProject = async (
  projectId: string,
  userId: string,
  input: UpdateProjectInput,
) => {
  await requireProjectOwner(projectId, userId);

  try {
    return await prisma.project.update({
      where: { id: projectId },
      data: {
        name: input.name,
        description: normalizeDescription(input.description),
      },
      select: projectDetailSelect,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new AppError(404, "PROJECT_NOT_FOUND", "Project was not found.");
    }

    throw error;
  }
};

export const deleteProject = async (projectId: string, userId: string) => {
  await requireProjectOwner(projectId, userId);

  try {
    await prisma.project.delete({ where: { id: projectId } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new AppError(404, "PROJECT_NOT_FOUND", "Project was not found.");
    }

    throw error;
  }
};
