import { prisma } from "../database/prisma.js";

export interface HealthStatus {
  database: "connected" | "unavailable";
  service: "flowboard-api";
  status: "ok" | "degraded";
  timestamp: string;
  uptime: number;
}

export const getHealthStatus = async (): Promise<HealthStatus> => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return {
      status: "ok",
      service: "flowboard-api",
      database: "connected",
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
    };
  } catch {
    return {
      status: "degraded",
      service: "flowboard-api",
      database: "unavailable",
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
    };
  }
};
