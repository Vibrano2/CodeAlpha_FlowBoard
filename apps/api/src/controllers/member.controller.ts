import type { RequestHandler } from "express";
import {
  addProjectMember,
  listProjectMembers,
  removeProjectMember,
} from "../services/member.service.js";
import {
  addMemberSchema,
  memberParamsSchema,
  projectMemberParamsSchema,
} from "../validators/member.validators.js";

export const listMembers: RequestHandler = async (request, response) => {
  const { projectId } = projectMemberParamsSchema.parse(request.params);
  const members = await listProjectMembers(projectId, request.authUser!.id);
  response.status(200).json({ success: true, data: { members } });
};

export const addMember: RequestHandler = async (request, response) => {
  const { projectId } = projectMemberParamsSchema.parse(request.params);
  const { userId } = addMemberSchema.parse(request.body);
  const member = await addProjectMember(projectId, request.authUser!.id, userId);
  response.status(201).json({ success: true, data: { member } });
};

export const removeMember: RequestHandler = async (request, response) => {
  const { projectId, userId } = memberParamsSchema.parse(request.params);
  await removeProjectMember(projectId, request.authUser!.id, userId);
  response.status(200).json({
    success: true,
    data: { message: "Project member removed successfully." },
  });
};
