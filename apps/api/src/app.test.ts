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

  it("applies security headers and prevents API response caching", async () => {
    const response = await request(createApp()).get("/api/v1/health");

    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["content-security-policy"]).toContain("default-src 'self'");
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.headers["x-powered-by"]).toBeUndefined();
  });

  it("rejects malformed JSON with a safe client error", async () => {
    const response = await request(createApp())
      .post("/api/v1/auth/login")
      .set("Origin", "http://localhost:5173")
      .set("Content-Type", "application/json")
      .send('{"email":"victor@example.com"');

    expect(response.status).toBe(400);
    expect(response.body.error).toEqual({
      code: "INVALID_JSON",
      message: "Request body contains invalid JSON.",
    });
  });

  it("rejects oversized request bodies without exposing an internal error", async () => {
    const response = await request(createApp())
      .post("/api/v1/auth/login")
      .set("Origin", "http://localhost:5173")
      .send({ email: "victor@example.com", password: "x".repeat(1_050_000) });

    expect(response.status).toBe(413);
    expect(response.body.error.code).toBe("PAYLOAD_TOO_LARGE");
  });

  it("allows cross-site unsafe requests from an explicitly trusted origin", async () => {
    const response = await request(createApp())
      .post("/api/v1/auth/logout")
      .set("Origin", "http://localhost:5173")
      .set("Sec-Fetch-Site", "cross-site");

    expect(response.status).toBe(200);
  });

  it("rejects non-JSON bodies and untrusted cross-site unsafe requests", async () => {
    const wrongType = await request(createApp())
      .post("/api/v1/auth/login")
      .set("Origin", "http://localhost:5173")
      .type("form")
      .send({ email: "victor@example.com", password: "Secure123" });
    const crossSite = await request(createApp())
      .post("/api/v1/auth/logout")
      .set("Sec-Fetch-Site", "cross-site");

    expect(wrongType.status).toBe(415);
    expect(wrongType.body.error.code).toBe("UNSUPPORTED_MEDIA_TYPE");
    expect(crossSite.status).toBe(403);
    expect(crossSite.body.error.code).toBe("INVALID_ORIGIN");
  });

  it("rejects unknown input fields instead of silently accepting them", async () => {
    const response = await request(createApp())
      .post("/api/v1/auth/login")
      .set("Origin", "http://localhost:5173")
      .send({
        email: "victor@example.com",
        password: "Secure123",
        role: "OWNER",
      });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});
