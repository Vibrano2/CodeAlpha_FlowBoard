import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const userId = "708fe7a5-4696-43b4-bdf1-4ef5e19f845a";
const now = new Date("2026-09-04T06:00:00.000Z");

const databaseMocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  create: vi.fn(),
  queryRaw: vi.fn().mockResolvedValue([{ result: 1 }]),
}));

vi.mock("../database/prisma.js", () => ({
  prisma: {
    $queryRaw: databaseMocks.queryRaw,
    user: {
      findUnique: databaseMocks.findUnique,
      create: databaseMocks.create,
    },
  },
}));

import { createApp } from "../app.js";

const safeUser = {
  id: userId,
  name: "Victor Ibrahim",
  email: "victor@example.com",
  avatarUrl: null,
  createdAt: now,
  updatedAt: now,
};

describe("authentication API", () => {
  beforeEach(() => {
    databaseMocks.findUnique.mockReset();
    databaseMocks.create.mockReset();
  });

  it("registers a user, hashes the password, and starts an HTTP-only session", async () => {
    databaseMocks.findUnique.mockResolvedValueOnce(null);
    databaseMocks.create.mockImplementationOnce(async ({ data }) => ({
      ...safeUser,
      name: data.name,
      email: data.email,
    }));

    const response = await request(createApp())
      .post("/api/v1/auth/register")
      .set("Origin", "http://localhost:5173")
      .send({
        name: "  Victor Ibrahim  ",
        email: "VICTOR@example.com",
        password: "Secure123",
      });

    expect(response.status).toBe(201);
    expect(response.body.data.user).toMatchObject({
      id: userId,
      name: "Victor Ibrahim",
      email: "victor@example.com",
    });
    expect(JSON.stringify(response.body)).not.toContain("password");
    expect(response.headers["set-cookie"]![0]).toContain("HttpOnly");
    expect(response.headers["set-cookie"]![0]).toContain("SameSite=Lax");

    const createInput = databaseMocks.create.mock.calls[0]![0].data;
    expect(createInput).not.toHaveProperty("password");
    expect(await bcrypt.compare("Secure123", createInput.passwordHash)).toBe(true);
  });

  it("rejects malformed registration input", async () => {
    const response = await request(createApp())
      .post("/api/v1/auth/register")
      .set("Origin", "http://localhost:5173")
      .send({ name: "V", email: "invalid", password: "weak" });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(databaseMocks.create).not.toHaveBeenCalled();
  });

  it("returns a conflict for a duplicate email", async () => {
    databaseMocks.findUnique.mockResolvedValueOnce({ id: userId });

    const response = await request(createApp())
      .post("/api/v1/auth/register")
      .set("Origin", "http://localhost:5173")
      .send({ name: "Victor Ibrahim", email: "victor@example.com", password: "Secure123" });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("EMAIL_IN_USE");
  });

  it("logs in with valid credentials without exposing the password hash", async () => {
    databaseMocks.findUnique.mockResolvedValueOnce({
      ...safeUser,
      passwordHash: await bcrypt.hash("Secure123", 4),
    });

    const response = await request(createApp())
      .post("/api/v1/auth/login")
      .set("Origin", "http://localhost:5173")
      .send({ email: "VICTOR@example.com", password: "Secure123" });

    expect(response.status).toBe(200);
    expect(response.body.data.user.email).toBe("victor@example.com");
    expect(response.body.data.user).not.toHaveProperty("passwordHash");
    expect(response.headers["set-cookie"]![0]).toContain("flowboard_session=");
  });

  it("uses the same login error whether the account or password is invalid", async () => {
    databaseMocks.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        ...safeUser,
        passwordHash: await bcrypt.hash("Secure123", 4),
      });

    const missingAccount = await request(createApp())
      .post("/api/v1/auth/login")
      .set("Origin", "http://localhost:5173")
      .send({ email: "missing@example.com", password: "Secure123" });
    const wrongPassword = await request(createApp())
      .post("/api/v1/auth/login")
      .set("Origin", "http://localhost:5173")
      .send({ email: "victor@example.com", password: "Incorrect123" });

    expect(missingAccount.status).toBe(401);
    expect(wrongPassword.status).toBe(401);
    expect(missingAccount.body.error).toEqual(wrongPassword.body.error);
  });

  it("protects the current-user endpoint and clears an expired session", async () => {
    const unauthenticated = await request(createApp()).get("/api/v1/auth/me");
    const expiredToken = jwt.sign({}, process.env.JWT_SECRET!, {
      audience: "flowboard-web",
      issuer: "flowboard-api",
      subject: userId,
      expiresIn: -1,
    });
    const expired = await request(createApp())
      .get("/api/v1/auth/me")
      .set("Cookie", `flowboard_session=${expiredToken}`);

    expect(unauthenticated.status).toBe(401);
    expect(expired.status).toBe(401);
    expect(expired.headers["set-cookie"]![0]).toContain("flowboard_session=;");
  });

  it("returns the current user for a valid session", async () => {
    databaseMocks.findUnique.mockResolvedValueOnce(safeUser);
    const token = jwt.sign({}, process.env.JWT_SECRET!, {
      audience: "flowboard-web",
      issuer: "flowboard-api",
      subject: userId,
      expiresIn: "1h",
    });

    const response = await request(createApp())
      .get("/api/v1/auth/me")
      .set("Cookie", `flowboard_session=${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.user).toMatchObject({ id: userId, email: safeUser.email });
  });

  it("clears the authentication cookie on logout", async () => {
    const response = await request(createApp())
      .post("/api/v1/auth/logout")
      .set("Origin", "http://localhost:5173");

    expect(response.status).toBe(200);
    expect(response.headers["set-cookie"]![0]).toContain("flowboard_session=;");
  });

  it("rejects state-changing requests from an untrusted origin", async () => {
    const response = await request(createApp())
      .post("/api/v1/auth/login")
      .set("Origin", "https://attacker.example")
      .send({ email: "victor@example.com", password: "Secure123" });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("INVALID_ORIGIN");
  });

  it("rate limits repeated authentication attempts", async () => {
    let rateLimitedResponse;

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const response = await request(createApp())
        .post("/api/v1/auth/login")
        .set("Origin", "http://localhost:5173")
        .send({ email: "attacker@example.com", password: "Incorrect123" });

      if (response.status === 429) {
        rateLimitedResponse = response;
        break;
      }
    }

    expect(rateLimitedResponse?.status).toBe(429);
    expect(rateLimitedResponse?.body.error.code).toBe("RATE_LIMITED");
  });
});
