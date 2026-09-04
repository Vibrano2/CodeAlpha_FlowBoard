import type { RequestHandler } from "express";
import { listProjectActivity } from "../services/activity.service.js";
import { activityQuerySchema } from "../validators/activity.validators.js";
import { projectIdParamsSchema } from "../validators/project.validators.js";

export const listActivity: RequestHandler = async (request, response) => {
  const { projectId } = projectIdParamsSchema.parse(request.params);
  const { taskId } = activityQuerySchema.parse(request.query);
  const activities = await listProjectActivity(projectId, request.authUser!.id, taskId);
  response.status(200).json({ success: true, data: { activities } });
};
