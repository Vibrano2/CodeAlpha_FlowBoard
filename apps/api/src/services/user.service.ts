import { Prisma } from "@prisma/client";
import { prisma } from "../database/prisma.js";
import { AppError } from "../utils/app-error.js";
import type { UpdateProfileInput } from "../validators/user.validators.js";

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export const searchUsersByEmail = (email: string) =>
  prisma.user.findMany({
    where: { email: { contains: email, mode: "insensitive" } },
    orderBy: { email: "asc" },
    take: 10,
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
    },
  });

export const updateUserProfile = async (userId: string, input: UpdateProfileInput) => {
  try {
    return await prisma.user.update({
      where: { id: userId },
      data: input,
      select: safeUserSelect,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        throw new AppError(409, "EMAIL_IN_USE", "An account with this email already exists.");
      }
      if (error.code === "P2025") {
        throw new AppError(404, "USER_NOT_FOUND", "User was not found.");
      }
    }

    throw error;
  }
};
