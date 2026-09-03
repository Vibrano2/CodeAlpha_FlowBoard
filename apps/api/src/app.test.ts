import request from "supertest";
import { describe, expect, it, vi } from "vitest";

vi.mock("./database/prisma.js", () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ result: 1 }]),
  },
}));

import { createApp } from "./app.js";

describe("FlowBoard API", () => {
  it("reports application and database health", async () => {
    const response = await request(createApp()).get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        status: "ok",
        service: "flowboard-api",
        database: "connected",
      },
    });
  });

  it("returns the consistent error envelope for unknown routes", async () => {
    const response = await request(createApp()).get("/api/v1/unknown");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Route GET /api/v1/unknown was not found.",
      },
    });
  });
});
