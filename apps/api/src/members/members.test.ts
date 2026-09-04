import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const ownerId = "708fe7a5-4696-43b4-bdf1-4ef5e19f845a";
const memberId = "d5f6070d-d0bb-4cf1-86dc-680fcfe0556d";
const projectId = "f9534ad1-f82a-414f-ae76-b2655d881f6d";
const membershipId = "f8c9466b-8c7c-4b85-b418-e11806c7387e";
const now = new Date("2026-09-04T12:00:00.000Z");

const databaseMocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  userFindMany: vi.fn(),
  membershipFindUnique: vi.fn(),
  membershipFindMany: vi.fn(),
  membershipCreate: vi.fn(),
  membershipDelete: vi.fn(),
  taskUpdateMany: vi.fn(),
  activityCreate: vi.fn(),
  transaction: vi.fn(),
  queryRaw: vi.fn().mockResolvedValue([{ result: 1 }]),
}));

vi.mock("../database/prisma.js", () => ({
  prisma: {
    $queryRaw: databaseMocks.queryRaw,
    $transaction: databaseMocks.transaction,
    user: {
      findUnique: databaseMocks.userFindUnique,
      findMany: databaseMocks.userFindMany,
    },
    projectMember: {
      findUnique: databaseMocks.membershipFindUnique,
      findMany: databaseMocks.membershipFindMany,
      create: databaseMocks.membershipCreate,
      delete: databaseMocks.membershipDelete,
    },
    task: { updateMany: databaseMocks.taskUpdateMany },
    activityLog: { create: databaseMocks.activityCreate },
  },
}));

import { createApp } from "../app.js";

const safeOwner = {
  id: ownerId,
  name: "Victor Ibrahim",
  email: "victor@example.com",
  avatarUrl: null,
  createdAt: now,
  updatedAt: now,
};

const memberUser = {
  id: memberId,
  name: "Amina Bello",
  email: "amina@example.com",
  avatarUrl: null,
};

const membership = {
  id: membershipId,
  projectId,
  userId: memberId,
  role: "MEMBER",
  joinedAt: now,
  user: memberUser,
};

const ownerAccess = {
  role: "OWNER",
  project: { id: projectId, ownerId },
};

const memberAccess = {
  role: "MEMBER",
  project: { id: projectId, ownerId },
};

const authCookie = () => {
  const token = jwt.sign({}, process.env.JWT_SECRET!, {
    audience: "flowboard-web",
    issuer: "flowboard-api",
    subject: ownerId,
    expiresIn: "1h",
  });
  return `flowboard_session=${token}`;
};

describe("user search and project member API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    databaseMocks.userFindUnique.mockResolvedValue(safeOwner);
    databaseMocks.userFindMany.mockResolvedValue([]);
    databaseMocks.membershipCreate.mockResolvedValue(membership);
    databaseMocks.membershipDelete.mockResolvedValue(membership);
    databaseMocks.taskUpdateMany.mockResolvedValue({ count: 0 });
    databaseMocks.activityCreate.mockResolvedValue({ id: "activity-id" });
    databaseMocks.transaction.mockImplementation(async (operations: unknown[]) => Promise.all(operations));
  });

  it("requires authentication and validates user email search", async () => {
    const unauthenticated = await request(createApp()).get("/api/v1/users/search?email=amina");
    const invalid = await request(createApp())
      .get("/api/v1/users/search?email=a")
      .set("Cookie", authCookie());

    expect(unauthenticated.status).toBe(401);
    expect(invalid.status).toBe(422);
  });

  it("searches registered users without exposing password data", async () => {
    databaseMocks.userFindMany.mockResolvedValue([memberUser]);

    const response = await request(createApp())
      .get("/api/v1/users/search?email=AMINA")
      .set("Cookie", authCookie());

    expect(response.status).toBe(200);
    expect(response.body.data.users).toEqual([memberUser]);
    expect(JSON.stringify(response.body)).not.toContain("password");
    expect(databaseMocks.userFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: { contains: "amina", mode: "insensitive" } },
        take: 10,
      }),
    );
  });

  it("allows project members to list membership", async () => {
    databaseMocks.membershipFindUnique.mockResolvedValue(memberAccess);
    databaseMocks.membershipFindMany.mockResolvedValue([membership]);

    const response = await request(createApp())
      .get(`/api/v1/projects/${projectId}/members`)
      .set("Cookie", authCookie());

    expect(response.status).toBe(200);
    expect(response.body.data.members[0]).toMatchObject({ userId: memberId, role: "MEMBER" });
    expect(databaseMocks.membershipFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { projectId } }),
    );
  });

  it("does not expose a member list to project outsiders", async () => {
    databaseMocks.membershipFindUnique.mockResolvedValue(null);

    const response = await request(createApp())
      .get(`/api/v1/projects/${projectId}/members`)
      .set("Cookie", authCookie());

    expect(response.status).toBe(404);
    expect(databaseMocks.membershipFindMany).not.toHaveBeenCalled();
  });

  it("allows the owner to add a registered user and records activity", async () => {
    databaseMocks.membershipFindUnique
      .mockResolvedValueOnce(ownerAccess)
      .mockResolvedValueOnce(null);
    databaseMocks.userFindUnique
      .mockResolvedValueOnce(safeOwner)
      .mockResolvedValueOnce({ id: memberId });

    const response = await request(createApp())
      .post(`/api/v1/projects/${projectId}/members`)
      .set("Cookie", authCookie())
      .set("Origin", "http://localhost:5173")
      .send({ userId: memberId });

    expect(response.status).toBe(201);
    expect(response.body.data.member.user.email).toBe(memberUser.email);
    expect(databaseMocks.membershipCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { projectId, userId: memberId, role: "MEMBER" } }),
    );
    expect(databaseMocks.activityCreate).toHaveBeenCalledWith({
      data: {
        projectId,
        actorId: ownerId,
        action: "MEMBER_ADDED",
        metadata: { memberId },
      },
    });
    expect(databaseMocks.transaction).toHaveBeenCalledTimes(1);
  });

  it("rejects duplicate members and nonexistent users", async () => {
    databaseMocks.membershipFindUnique
      .mockResolvedValueOnce(ownerAccess)
      .mockResolvedValueOnce({ id: membershipId });

    const duplicate = await request(createApp())
      .post(`/api/v1/projects/${projectId}/members`)
      .set("Cookie", authCookie())
      .set("Origin", "http://localhost:5173")
      .send({ userId: memberId });

    databaseMocks.membershipFindUnique.mockReset().mockResolvedValueOnce(ownerAccess);
    databaseMocks.userFindUnique
      .mockReset()
      .mockResolvedValueOnce(safeOwner)
      .mockResolvedValueOnce(null);

    const nonexistent = await request(createApp())
      .post(`/api/v1/projects/${projectId}/members`)
      .set("Cookie", authCookie())
      .set("Origin", "http://localhost:5173")
      .send({ userId: memberId });

    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe("ALREADY_A_MEMBER");
    expect(nonexistent.status).toBe(404);
    expect(nonexistent.body.error.code).toBe("USER_NOT_FOUND");
  });

  it("prevents non-owners from adding or removing members", async () => {
    databaseMocks.membershipFindUnique.mockResolvedValue(memberAccess);

    const addResponse = await request(createApp())
      .post(`/api/v1/projects/${projectId}/members`)
      .set("Cookie", authCookie())
      .set("Origin", "http://localhost:5173")
      .send({ userId: memberId });
    const removeResponse = await request(createApp())
      .delete(`/api/v1/projects/${projectId}/members/${memberId}`)
      .set("Cookie", authCookie())
      .set("Origin", "http://localhost:5173");

    expect(addResponse.status).toBe(403);
    expect(removeResponse.status).toBe(403);
    expect(databaseMocks.transaction).not.toHaveBeenCalled();
  });

  it("prevents the owner from removing themselves", async () => {
    databaseMocks.membershipFindUnique.mockResolvedValue(ownerAccess);

    const response = await request(createApp())
      .delete(`/api/v1/projects/${projectId}/members/${ownerId}`)
      .set("Cookie", authCookie())
      .set("Origin", "http://localhost:5173");

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("OWNER_REMOVAL_FORBIDDEN");
    expect(databaseMocks.membershipDelete).not.toHaveBeenCalled();
  });

  it("removes a member, records activity, and immediately revokes project access", async () => {
    databaseMocks.membershipFindUnique
      .mockResolvedValueOnce(ownerAccess)
      .mockResolvedValueOnce({ id: membershipId });

    const removal = await request(createApp())
      .delete(`/api/v1/projects/${projectId}/members/${memberId}`)
      .set("Cookie", authCookie())
      .set("Origin", "http://localhost:5173");

    expect(removal.status).toBe(200);
    expect(databaseMocks.membershipDelete).toHaveBeenCalledWith({
      where: { projectId_userId: { projectId, userId: memberId } },
    });
    expect(databaseMocks.taskUpdateMany).toHaveBeenCalledWith({
      where: { projectId, assigneeId: memberId },
      data: { assigneeId: null },
    });
    expect(databaseMocks.activityCreate).toHaveBeenCalledWith({
      data: {
        projectId,
        actorId: ownerId,
        action: "MEMBER_REMOVED",
        metadata: { memberId },
      },
    });

    databaseMocks.membershipFindUnique.mockReset().mockResolvedValueOnce(null);
    const revokedAccess = await request(createApp())
      .get(`/api/v1/projects/${projectId}/members`)
      .set("Cookie", authCookie());

    expect(revokedAccess.status).toBe(404);
  });
});
