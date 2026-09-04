import type { AuthResponse, LoginInput, RegisterInput, UpdateProfileInput, User } from "../types/auth";
import { ApiError, apiRequest } from "./api";

export const authQueryKey = ["auth", "me"] as const;

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const response = await apiRequest<AuthResponse>("/auth/me");
    return response.data.user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }

    throw error;
  }
};

export const register = (input: RegisterInput) =>
  apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });

export const login = (input: LoginInput) =>
  apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });

export const logout = () =>
  apiRequest<{ success: true; data: { message: string } }>("/auth/logout", {
    method: "POST",
  });

export const updateProfile = (input: UpdateProfileInput) =>
  apiRequest<AuthResponse>("/users/me", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
