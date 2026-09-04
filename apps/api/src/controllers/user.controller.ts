import type { RequestHandler } from "express";
import { searchUsersByEmail } from "../services/user.service.js";
import { searchUsersQuerySchema } from "../validators/user.validators.js";

export const searchUsers: RequestHandler = async (request, response) => {
  const { email } = searchUsersQuerySchema.parse(request.query);
  const users = await searchUsersByEmail(email);
  response.status(200).json({ success: true, data: { users } });
};
