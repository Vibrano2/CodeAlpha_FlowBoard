import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const userId = "708fe7a5-4696-43b4-bdf1-4ef5e19f845a";
const memberId = "d5f6070d-d0bb-4cf1-86dc-680fcfe0556d";
const projectId = "f9534ad1-f82a-414f-ae76-b2655d881f6d";
const boardId = "7a23762d-075d-4c99-a82c-2e2ae7553402";
const now = new Date("2026-09-04T11:30:00.000Z");

const databaseMocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  projectFindMany: vi.fn(),
  projectCreate: vi.fn(),
  projectFindUnique: vi.fn(),
  projectUpdate: vi.fn(),
  projectDelete: vi.fn(),
  membershipFindUnique: vi.fn(),
  queryRaw: vi.fn().mockResolvedValue([{ result: 1 }]),
}));

vi.mock("../database/prisma.js", () => ({
  prisma: {
    $queryRaw: databaseMocks.queryRaw,
    user: { findUnique: databaseMocks.userFindUnique },
    project: {
      findMany: databaseMocks.projectFindMany,
      create: databaseMocks.projectCreate,
      findUnique: databaseMocks.projectFindUnique,
      update: databaseMocks.projectUpdate,
      delete: databaseMocks.projectDelete,
    },
    projectMember: { findUnique: databaseMocks.membershipFindUnique },
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

const project = {
  id: projectId,
  name: "Website launch",
  description: "Coordinate the launch work.",
  ownerId: userId,
  createdAt: now,
  updatedAt: now,
  owner: {
    id: userId,
    name: safeUser.name,
    email: safeUser.email,
    avatarUrl: null,
  },
  board: { id: boardId, name: "Project Board", createdAt: now, updatedAt: now },
  _count: { members: 1 },
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

const authenticatedRequest = () => request(createApp());

describe("project API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    databaseMocks.userFindUnique.mockResolvedValue(safeUser);
  });

  it("requires authentication for project routes", async () => {
    const response = await request(createApp()).get("/api/v1/projects");
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("lists only projects where the current user is a member", async () => {
    databaseMocks.projectFindMany.mockResolvedValue([{ ...project, members: [{ role: "OWNER" }] }]);

    const response = await authenticatedRequest()
      .get("/api/v1/projects")
      .set("Cookie", authCookie());

    expect(response.status).toBe(200);
    expect(response.body.data.projects[0]).toMatchObject({
      id: projectId,
      currentUserRole: "OWNER",
    });
    expect(databaseMocks.projectFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { members: { some: { userId } } } }),
    );
  });

  it("creates a project with owner membership, default board, and activity atomically", async () => {
    databaseMocks.projectCreate.mockResolvedValue(project);

    const response = await authenticatedRequest()
      .post("/api/v1/projects")
      .set("Cookie", authCookie())
      .set("Origin", "http://localhost:5173")
      .send({ name: "  Website launch  ", description: "Coordinate the launch work." });

    expect(response.status).toBe(201);
    expect(response.body.data.project).toMatchObject({
      id: projectId,
      name: project.name,
      currentUserRole: "OWNER",
      board: { name: "Project Board" },
    });
    expect(databaseMocks.projectCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Website launch",
          ownerId: userId,
          members: { create: { userId, role: "OWNER" } },
          board: { create: { name: "Project Board" } },
          activities: { create: { actorId: userId, action: "PROJECT_CREATED" } },
        }),
      }),
    );
  });

  it("rejects invalid project input", async () => {
    const response = await authenticatedRequest()
      .post("/api/v1/projects")
      .set("Cookie", authCookie())
      .set("Origin", "http://localhost:5173")
      .send({ name: " " });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(databaseMocks.projectCreate).not.toHaveBeenCalled();
  });

  it("allows a project member to read the project", async () => {
    databaseMocks.membershipFindUnique.mockResolvedValue({
      role: "MEMBER",
      project: { id: projectId, ownerId: userId },
    });
    databaseMocks.projectFindUnique.mockResolvedValue(project);

    const response = await authenticatedRequest()
      .get(`/api/v1/projects/${projectId}`)
      .set("Cookie", authCookie());

    expect(response.status).toBe(200);
    expect(response.body.data.project.currentUserRole).toBe("MEMBER");
  });

  it("does not reveal an inaccessible project to an outsider", async () => {
    databaseMocks.membershipFindUnique.mockResolvedValue(null);

    const response = await authenticatedRequest()
      .get(`/api/v1/projects/${projectId}`)
      .set("Cookie", authCookie());

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("PROJECT_NOT_FOUND");
    expect(databaseMocks.projectFindUnique).not.toHaveBeenCalled();
  });

  it("allows only the owner to update project settings", async () => {
    databaseMocks.membershipFindUnique
      .mockResolvedValueOnce({ role: "MEMBER", project: { id: projectId, ownerId: memberId } })
      .mockResolvedValueOnce({ role: "OWNER", project: { id: projectId, ownerId: userId } });
    databaseMocks.projectUpdate.mockResolvedValue({ ...project, name: "Updated launch" });

    const memberResponse = await authenticatedRequest()
      .patch(`/api/v1/projects/${projectId}`)
      .set("Cookie", authCookie())
      .set("Origin", "http://localhost:5173")
      .send({ name: "Unauthorized update" });
    const ownerResponse = await authenticatedRequest()
      .patch(`/api/v1/projects/${projectId}`)
      .set("Cookie", authCookie())
      .set("Origin", "http://localhost:5173")
      .send({ name: "Updated launch" });

    expect(memberResponse.status).toBe(403);
    expect(ownerResponse.status).toBe(200);
    expect(ownerResponse.body.data.project.name).toBe("Updated launch");
    expect(databaseMocks.projectUpdate).toHaveBeenCalledTimes(1);
  });

  it("allows only the owner to delete a project", async () => {
    databaseMocks.membershipFindUnique
      .mockResolvedValueOnce({ role: "MEMBER", project: { id: projectId, ownerId: memberId } })
      .mockResolvedValueOnce({ role: "OWNER", project: { id: projectId, ownerId: userId } });
    databaseMocks.projectDelete.mockResolvedValue(project);

    const memberResponse = await authenticatedRequest()
      .delete(`/api/v1/projects/${projectId}`)
      .set("Cookie", authCookie())
      .set("Origin", "http://localhost:5173");
    const ownerResponse = await authenticatedRequest()
      .delete(`/api/v1/projects/${projectId}`)
      .set("Cookie", authCookie())
      .set("Origin", "http://localhost:5173");

    expect(memberResponse.status).toBe(403);
    expect(ownerResponse.status).toBe(200);
    expect(databaseMocks.projectDelete).toHaveBeenCalledWith({ where: { id: projectId } });
  });

  it("rejects malformed project IDs cleanly", async () => {
    const response = await authenticatedRequest()
      .get("/api/v1/projects/not-a-uuid")
      .set("Cookie", authCookie());

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});
