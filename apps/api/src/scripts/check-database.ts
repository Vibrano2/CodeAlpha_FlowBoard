import { prisma } from "../database/prisma.js";

try {
  await prisma.$queryRaw`SELECT 1`;
  console.info("Database connection successful.");
} catch {
  console.error("Database connection failed. Check DATABASE_URL and PostgreSQL availability.");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
