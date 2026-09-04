import { prisma } from "../database/prisma.js";

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
