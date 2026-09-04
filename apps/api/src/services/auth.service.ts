import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "../database/prisma.js";
import type { SafeUser } from "../types/auth.js";
import { AppError } from "../utils/app-error.js";
import type { LoginInput, RegisterInput } from "../validators/auth.validators.js";

const passwordHashRounds = 12;
const fallbackPasswordHash =
  "$2b$12$8a7oK9XxPzgF23rKZV4OdeK7vR6nH4KoY2VqM7tUQt2YtFf0B8XYS";

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export const registerUser = async (input: RegisterInput): Promise<SafeUser> => {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existingUser) {
    throw new AppError(409, "EMAIL_IN_USE", "An account with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(input.password, passwordHashRounds);

  try {
    return await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
      },
      select: safeUserSelect,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError(409, "EMAIL_IN_USE", "An account with this email already exists.");
    }

    throw error;
  }
};

export const authenticateUser = async (input: LoginInput): Promise<SafeUser> => {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  const passwordMatches = await bcrypt.compare(
    input.password,
    user?.passwordHash ?? fallbackPasswordHash,
  );

  if (!user || !passwordMatches) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password.");
  }

  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
};

export const getUserById = (id: string): Promise<SafeUser | null> =>
  prisma.user.findUnique({ where: { id }, select: safeUserSelect });
