import type { RequestHandler } from "express";
import { authenticateUser, registerUser } from "../services/auth.service.js";
import { clearAuthCookie, setAuthCookie } from "../utils/auth-cookie.js";
import { createAuthToken } from "../utils/auth-token.js";
import { loginSchema, registerSchema } from "../validators/auth.validators.js";

export const register: RequestHandler = async (request, response) => {
  const input = registerSchema.parse(request.body);
  const user = await registerUser(input);
  setAuthCookie(response, createAuthToken(user.id));

  response.status(201).json({ success: true, data: { user } });
};

export const login: RequestHandler = async (request, response) => {
  const input = loginSchema.parse(request.body);
  const user = await authenticateUser(input);
  setAuthCookie(response, createAuthToken(user.id));

  response.status(200).json({ success: true, data: { user } });
};

export const logout: RequestHandler = (_request, response) => {
  clearAuthCookie(response);
  response.status(200).json({ success: true, data: { message: "Logged out successfully." } });
};

export const me: RequestHandler = (request, response) => {
  response.status(200).json({ success: true, data: { user: request.authUser } });
};
