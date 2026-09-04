import type { RequestHandler } from "express";
import { getProjectBoard } from "../services/board.service.js";
import { projectIdParamsSchema } from "../validators/project.validators.js";

export const getBoard: RequestHandler = async (request, response) => {
  const { projectId } = projectIdParamsSchema.parse(request.params);
  const board = await getProjectBoard(projectId, request.authUser!.id);
  response.status(200).json({ success: true, data: { board } });
};
