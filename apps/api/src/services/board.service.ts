import { prisma } from "../database/prisma.js";
import { AppError } from "../utils/app-error.js";
import { requireProjectMember } from "./project-access.service.js";

export const getProjectBoard = async (projectId: string, actorId: string) => {
  await requireProjectMember(projectId, actorId);

  const board = await prisma.board.findUnique({
    where: { projectId },
    select: {
      id: true,
      projectId: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!board) {
    throw new AppError(404, "BOARD_NOT_FOUND", "Project board was not found.");
  }

  return board;
};
