import type { RequestHandler } from "express";
import { searchUsersByEmail, updateUserProfile } from "../services/user.service.js";
import { searchUsersQuerySchema, updateProfileSchema } from "../validators/user.validators.js";

export const getCurrentUserProfile: RequestHandler = (request, response) => {
  response.status(200).json({ success: true, data: { user: request.authUser } });
};

export const updateCurrentUserProfile: RequestHandler = async (request, response) => {
  const input = updateProfileSchema.parse(request.body);
  const user = await updateUserProfile(request.authUser!.id, input);
  response.status(200).json({ success: true, data: { user } });
};

export const searchUsers: RequestHandler = async (request, response) => {
  const { email } = searchUsersQuerySchema.parse(request.query);
  const users = await searchUsersByEmail(email);
  response.status(200).json({ success: true, data: { users } });
};
