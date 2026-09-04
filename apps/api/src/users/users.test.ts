import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const userId = "708fe7a5-4696-43b4-bdf1-4ef5e19f845a";
const now = new Date("2026-09-04T06:00:00.000Z");

const databaseMocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
}));

vi.mock("../database/prisma.js", () => ({
  prisma: {
    user: {
      findUnique: databaseMocks.findUnique,
      update: databaseMocks.update,
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

const authCookie = () => {
  const token = jwt.sign({}, process.env.JWT_SECRET!, {
    audience: "flowboard-web",
    issuer: "flowboard-api",
    subject: userId,
    expiresIn: "1h",
  });
  return `flowboard_session=${token}`;
};

describe("current user profile API", () => {
  beforeEach(() => {
    databaseMocks.findUnique.mockReset();
    databaseMocks.update.mockReset();
    databaseMocks.findUnique.mockResolvedValue(safeUser);
  });

  it("returns only the authenticated user's safe profile", async () => {
    const response = await request(createApp())
      .get("/api/v1/users/me")
      .set("Cookie", authCookie());

    expect(response.status).toBe(200);
    expect(response.body.data.user).toMatchObject({ id: userId, email: safeUser.email });
    expect(JSON.stringify(response.body)).not.toContain("password");
  });

  it("updates the authenticated user's own profile", async () => {
    const updatedUser = {
      ...safeUser,
      name: "Victor David",
      email: "victor.david@example.com",
      avatarUrl: "https://images.example.com/victor.jpg",
    };
    databaseMocks.update.mockResolvedValue(updatedUser);

    const response = await request(createApp())
      .patch("/api/v1/users/me")
      .set("Cookie", authCookie())
      .set("Origin", "http://localhost:5173")
      .send({
        name: "  Victor David  ",
        email: "VICTOR.DAVID@example.com",
        avatarUrl: updatedUser.avatarUrl,
      });

    expect(response.status).toBe(200);
    expect(response.body.data.user).toMatchObject({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      avatarUrl: updatedUser.avatarUrl,
    });
    expect(databaseMocks.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: userId },
      data: {
        name: updatedUser.name,
        email: updatedUser.email,
        avatarUrl: updatedUser.avatarUrl,
      },
    }));
  });

  it("rejects an insecure avatar URL", async () => {
    const response = await request(createApp())
      .patch("/api/v1/users/me")
      .set("Cookie", authCookie())
      .set("Origin", "http://localhost:5173")
      .send({
        name: safeUser.name,
        email: safeUser.email,
        avatarUrl: "http://images.example.com/victor.jpg",
      });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(databaseMocks.update).not.toHaveBeenCalled();
  });

  it("rejects profile changes without authentication", async () => {
    const response = await request(createApp())
      .patch("/api/v1/users/me")
      .set("Origin", "http://localhost:5173")
      .send({ name: safeUser.name, email: safeUser.email, avatarUrl: null });

    expect(response.status).toBe(401);
    expect(databaseMocks.update).not.toHaveBeenCalled();
  });
});
