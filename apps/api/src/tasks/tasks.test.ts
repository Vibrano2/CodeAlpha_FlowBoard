import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const actorId = "708fe7a5-4696-43b4-bdf1-4ef5e19f845a";
const assigneeId = "d5f6070d-d0bb-4cf1-86dc-680fcfe0556d";
const projectId = "f9534ad1-f82a-414f-ae76-b2655d881f6d";
const boardId = "7a23762d-075d-4c99-a82c-2e2ae7553402";
const taskId = "d56d146a-d851-49d4-b205-6397d4a3a789";
const now = new Date("2026-09-04T14:00:00.000Z");

const databaseMocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  membershipFindUnique: vi.fn(),
  boardFindUnique: vi.fn(),
  taskFindMany: vi.fn(),
  taskFindUnique: vi.fn(),
  taskAggregate: vi.fn(),
  taskCreate: vi.fn(),
  taskUpdate: vi.fn(),
  taskDelete: vi.fn(),
  activityCreate: vi.fn(),
  transaction: vi.fn(),
  queryRaw: vi.fn().mockResolvedValue([{ result: 1 }]),
}));

vi.mock("../database/prisma.js", () => ({
  prisma: {
    $queryRaw: databaseMocks.queryRaw,
    $transaction: databaseMocks.transaction,
    user: { findUnique: databaseMocks.userFindUnique },
    projectMember: { findUnique: databaseMocks.membershipFindUnique },
    board: { findUnique: databaseMocks.boardFindUnique },
    task: {
      findMany: databaseMocks.taskFindMany,
      findUnique: databaseMocks.taskFindUnique,
      aggregate: databaseMocks.taskAggregate,
      create: databaseMocks.taskCreate,
      update: databaseMocks.taskUpdate,
      delete: databaseMocks.taskDelete,
    },
    activityLog: { create: databaseMocks.activityCreate },
  },
}));

import { createApp } from "../app.js";

const actor = {
  id: actorId,
  name: "Victor Ibrahim",
  email: "victor@example.com",
  avatarUrl: null,
  createdAt: now,
  updatedAt: now,
};

const assignee = {
  id: assigneeId,
  name: "Amina Bello",
  email: "amina@example.com",
  avatarUrl: null,
};

const board = {
  id: boardId,
  projectId,
  name: "Project Board",
  createdAt: now,
  updatedAt: now,
};

const task = {
  id: taskId,
  projectId,
  boardId,
  title: "Build the project board",
  description: "Create four accessible Kanban columns.",
  status: "TODO",
  priority: "MEDIUM",
  assigneeId: null,
  createdBy: actorId,
  dueDate: null,
  position: 0,
  completedAt: null,
  createdAt: now,
  updatedAt: now,
  assignee: null,
  creator: actor,
  board: { id: boardId, name: board.name },
  project: { id: projectId, name: "Website launch" },
};

const memberAccess = {
  role: "MEMBER",
  project: { id: projectId, ownerId: assigneeId },
};

const authCookie = () => {
  const token = jwt.sign({}, process.env.JWT_SECRET!, {
    audience: "flowboard-web",
    issuer: "flowboard-api",
    subject: actorId,
    expiresIn: "1h",
  });
  return `flowboard_session=${token}`;
};

const authenticatedRequest = () => request(createApp());

describe("board and task API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    databaseMocks.userFindUnique.mockResolvedValue(actor);
    databaseMocks.membershipFindUnique.mockResolvedValue(memberAccess);
    databaseMocks.boardFindUnique.mockResolvedValue(board);
    databaseMocks.taskFindMany.mockResolvedValue([task]);
    databaseMocks.taskFindUnique.mockResolvedValue(task);
    databaseMocks.taskAggregate.mockResolvedValue({ _max: { position: null } });
    databaseMocks.taskCreate.mockResolvedValue(task);
    databaseMocks.taskUpdate.mockResolvedValue(task);
    databaseMocks.taskDelete.mockResolvedValue(task);
    databaseMocks.activityCreate.mockResolvedValue({ id: "activity-id" });
    databaseMocks.transaction.mockImplementation(
      async (callback: (client: unknown) => unknown) => callback({
        task: {
          aggregate: databaseMocks.taskAggregate,
          create: databaseMocks.taskCreate,
          update: databaseMocks.taskUpdate,
        },
        activityLog: { create: databaseMocks.activityCreate },
      }),
    );
  });

  it("requires authentication for board and task routes", async () => {
    const boardResponse = await request(createApp()).get(`/api/v1/projects/${projectId}/board`);
    const tasksResponse = await request(createApp()).get("/api/v1/tasks");

    expect(boardResponse.status).toBe(401);
    expect(tasksResponse.status).toBe(401);
  });

  it("allows members to read the project board and its tasks", async () => {
    const boardResponse = await authenticatedRequest()
      .get(`/api/v1/projects/${projectId}/board`)
      .set("Cookie", authCookie());
    const tasksResponse = await authenticatedRequest()
      .get(`/api/v1/projects/${projectId}/tasks`)
      .set("Cookie", authCookie());

    expect(boardResponse.status).toBe(200);
    expect(boardResponse.body.data.board.name).toBe("Project Board");
    expect(tasksResponse.status).toBe(200);
    expect(tasksResponse.body.data.tasks[0].id).toBe(taskId);
    expect(databaseMocks.taskFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { projectId } }),
    );
  });

  it("does not expose board or task-list data to outsiders", async () => {
    databaseMocks.membershipFindUnique.mockResolvedValue(null);

    const boardResponse = await authenticatedRequest()
      .get(`/api/v1/projects/${projectId}/board`)
      .set("Cookie", authCookie());
    const tasksResponse = await authenticatedRequest()
      .get(`/api/v1/projects/${projectId}/tasks`)
      .set("Cookie", authCookie());

    expect(boardResponse.status).toBe(404);
    expect(tasksResponse.status).toBe(404);
    expect(databaseMocks.boardFindUnique).not.toHaveBeenCalled();
    expect(databaseMocks.taskFindMany).not.toHaveBeenCalled();
  });

  it("lists only current, assigned, accessible tasks for the signed-in user", async () => {
    const response = await authenticatedRequest()
      .get("/api/v1/tasks")
      .set("Cookie", authCookie());

    expect(response.status).toBe(200);
    expect(databaseMocks.taskFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          assigneeId: actorId,
          project: { members: { some: { userId: actorId } } },
        },
      }),
    );
  });

  it("creates a task with default workflow values and server-generated activity", async () => {
    const assignedTask = { ...task, assigneeId, assignee };
    databaseMocks.membershipFindUnique
      .mockResolvedValueOnce(memberAccess)
      .mockResolvedValueOnce({ id: "assignee-membership" });
    databaseMocks.taskCreate.mockResolvedValue(assignedTask);

    const response = await authenticatedRequest()
      .post(`/api/v1/projects/${projectId}/tasks`)
      .set("Cookie", authCookie())
      .set("Origin", "http://localhost:5173")
      .send({
        title: "  Build the project board  ",
        description: "Create four accessible Kanban columns.",
        assigneeId,
        dueDate: "2026-09-10T23:59:59.999Z",
      });

    expect(response.status).toBe(201);
    expect(response.body.data.task.assigneeId).toBe(assigneeId);
    expect(databaseMocks.taskCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          projectId,
          boardId,
          title: "Build the project board",
          assigneeId,
          createdBy: actorId,
          position: 0,
        }),
      }),
    );
    expect(databaseMocks.activityCreate).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ data: expect.objectContaining({ action: "TASK_CREATED" }) }),
    );
    expect(databaseMocks.activityCreate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ data: expect.objectContaining({ action: "TASK_ASSIGNED" }) }),
    );
  });

  it("rejects assignment to a user outside the project", async () => {
    databaseMocks.membershipFindUnique
      .mockResolvedValueOnce(memberAccess)
      .mockResolvedValueOnce(null);

    const response = await authenticatedRequest()
      .post(`/api/v1/projects/${projectId}/tasks`)
      .set("Cookie", authCookie())
      .set("Origin", "http://localhost:5173")
      .send({ title: "Invalid assignment", assigneeId });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("INVALID_ASSIGNEE");
    expect(databaseMocks.transaction).not.toHaveBeenCalled();
  });

  it("rejects malformed task input and dates", async () => {
    const response = await authenticatedRequest()
      .post(`/api/v1/projects/${projectId}/tasks`)
      .set("Cookie", authCookie())
      .set("Origin", "http://localhost:5173")
      .send({ title: " ", dueDate: "next Thursday" });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(databaseMocks.transaction).not.toHaveBeenCalled();
  });

  it("protects task IDs from cross-project access", async () => {
    databaseMocks.membershipFindUnique.mockResolvedValue(null);

    const response = await authenticatedRequest()
      .get(`/api/v1/tasks/${taskId}`)
      .set("Cookie", authCookie());

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("PROJECT_NOT_FOUND");
    expect(response.body.data).toBeUndefined();
  });

  it("records status change and completion atomically", async () => {
    const completedTask = {
      ...task,
      status: "COMPLETED",
      position: 3,
      completedAt: now,
    };
    databaseMocks.taskAggregate.mockResolvedValue({ _max: { position: 2 } });
    databaseMocks.taskUpdate.mockResolvedValue(completedTask);

    const response = await authenticatedRequest()
      .patch(`/api/v1/tasks/${taskId}/status`)
      .set("Cookie", authCookie())
      .set("Origin", "http://localhost:5173")
      .send({ status: "COMPLETED" });

    expect(response.status).toBe(200);
    expect(databaseMocks.taskUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "COMPLETED",
          position: 3,
          completedAt: expect.any(Date),
        }),
      }),
    );
    expect(databaseMocks.activityCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "TASK_STATUS_CHANGED" }) }),
    );
    expect(databaseMocks.activityCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "TASK_COMPLETED" }) }),
    );
  });

  it("clears completedAt when a completed task moves back into progress", async () => {
    databaseMocks.taskFindUnique.mockResolvedValue({ ...task, status: "COMPLETED", completedAt: now });

    const response = await authenticatedRequest()
      .patch(`/api/v1/tasks/${taskId}`)
      .set("Cookie", authCookie())
      .set("Origin", "http://localhost:5173")
      .send({ status: "IN_PROGRESS" });

    expect(response.status).toBe(200);
    expect(databaseMocks.taskUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "IN_PROGRESS", completedAt: null }),
      }),
    );
  });

  it("updates priority, due date, and a valid assignee", async () => {
    const updatedTask = {
      ...task,
      priority: "URGENT",
      assigneeId,
      assignee,
      dueDate: new Date("2026-09-12T23:59:59.999Z"),
    };
    databaseMocks.membershipFindUnique
      .mockResolvedValueOnce(memberAccess)
      .mockResolvedValueOnce({ id: "assignee-membership" });
    databaseMocks.taskUpdate.mockResolvedValue(updatedTask);

    const response = await authenticatedRequest()
      .patch(`/api/v1/tasks/${taskId}`)
      .set("Cookie", authCookie())
      .set("Origin", "http://localhost:5173")
      .send({
        priority: "URGENT",
        assigneeId,
        dueDate: "2026-09-12T23:59:59.999Z",
      });

    expect(response.status).toBe(200);
    expect(databaseMocks.taskUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          priority: "URGENT",
          assigneeId,
          dueDate: expect.any(Date),
        }),
      }),
    );
    expect(databaseMocks.activityCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "TASK_ASSIGNED" }) }),
    );
  });

  it("supports unassignment through the specialized assignee endpoint", async () => {
    databaseMocks.taskFindUnique.mockResolvedValue({ ...task, assigneeId, assignee });

    const response = await authenticatedRequest()
      .patch(`/api/v1/tasks/${taskId}/assignee`)
      .set("Cookie", authCookie())
      .set("Origin", "http://localhost:5173")
      .send({ assigneeId: null });

    expect(response.status).toBe(200);
    expect(databaseMocks.taskUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ assigneeId: null }) }),
    );
  });

  it("validates task IDs and enum values without touching the database", async () => {
    const badId = await authenticatedRequest()
      .get("/api/v1/tasks/not-a-uuid")
      .set("Cookie", authCookie());
    const badPriority = await authenticatedRequest()
      .patch(`/api/v1/tasks/${taskId}`)
      .set("Cookie", authCookie())
      .set("Origin", "http://localhost:5173")
      .send({ priority: "CRITICAL" });

    expect(badId.status).toBe(422);
    expect(badPriority.status).toBe(422);
    expect(databaseMocks.taskUpdate).not.toHaveBeenCalled();
  });

  it("allows a project member to delete a task after confirmation is handled by the UI", async () => {
    const response = await authenticatedRequest()
      .delete(`/api/v1/tasks/${taskId}`)
      .set("Cookie", authCookie())
      .set("Origin", "http://localhost:5173");

    expect(response.status).toBe(200);
    expect(databaseMocks.taskDelete).toHaveBeenCalledWith({ where: { id: taskId } });
  });
});
