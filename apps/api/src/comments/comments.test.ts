import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const userId = "708fe7a5-4696-43b4-bdf1-4ef5e19f845a";
const otherUserId = "d5f6070d-d0bb-4cf1-86dc-680fcfe0556d";
const projectId = "f9534ad1-f82a-414f-ae76-b2655d881f6d";
const taskId = "d56d146a-d851-49d4-b205-6397d4a3a789";
const commentId = "a3959ec6-b7d8-4fe3-bc81-113685b0b348";
const now = new Date("2026-09-04T18:00:00.000Z");

const databaseMocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  membershipFindUnique: vi.fn(),
  taskFindUnique: vi.fn(),
  taskFindFirst: vi.fn(),
  commentFindMany: vi.fn(),
  commentFindUnique: vi.fn(),
  commentCreate: vi.fn(),
  commentUpdate: vi.fn(),
  commentDelete: vi.fn(),
  activityFindMany: vi.fn(),
  activityCreate: vi.fn(),
  notificationCreateMany: vi.fn(),
  transaction: vi.fn(),
  queryRaw: vi.fn().mockResolvedValue([{ result: 1 }]),
}));

vi.mock("../database/prisma.js", () => ({
  prisma: {
    $queryRaw: databaseMocks.queryRaw,
    $transaction: databaseMocks.transaction,
    user: { findUnique: databaseMocks.userFindUnique },
    projectMember: { findUnique: databaseMocks.membershipFindUnique },
    task: {
      findUnique: databaseMocks.taskFindUnique,
      findFirst: databaseMocks.taskFindFirst,
    },
    comment: {
      findMany: databaseMocks.commentFindMany,
      findUnique: databaseMocks.commentFindUnique,
      create: databaseMocks.commentCreate,
      update: databaseMocks.commentUpdate,
      delete: databaseMocks.commentDelete,
    },
    activityLog: {
      findMany: databaseMocks.activityFindMany,
      create: databaseMocks.activityCreate,
    },
    notification: { createMany: databaseMocks.notificationCreateMany },
  },
}));

import { createApp } from "../app.js";

const user = {
  id: userId,
  name: "Victor Ibrahim",
  email: "victor@example.com",
  avatarUrl: null,
  createdAt: now,
  updatedAt: now,
};

const comment = {
  id: commentId,
  taskId,
  userId,
  content: "The board is ready for review.",
  createdAt: now,
  updatedAt: now,
  user: { id: userId, name: user.name, email: user.email, avatarUrl: null },
};

const activity = {
  id: "d155067c-fd24-492f-90ec-cba3ff750738",
  projectId,
  taskId,
  actorId: userId,
  action: "COMMENT_ADDED",
  metadata: { commentId },
  createdAt: now,
  actor: comment.user,
  task: { id: taskId, title: "Build the project board" },
};

const memberAccess = {
  role: "MEMBER",
  project: { id: projectId, ownerId: otherUserId },
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

describe("comment and activity API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    databaseMocks.userFindUnique.mockResolvedValue(user);
    databaseMocks.membershipFindUnique.mockResolvedValue(memberAccess);
    databaseMocks.taskFindUnique.mockResolvedValue({
      id: taskId,
      projectId,
      title: "Build the project board",
      createdBy: userId,
      assigneeId: otherUserId,
    });
    databaseMocks.taskFindFirst.mockResolvedValue({ id: taskId });
    databaseMocks.commentFindMany.mockResolvedValue([comment]);
    databaseMocks.commentFindUnique.mockResolvedValue({
      id: commentId,
      taskId,
      userId,
      task: { projectId },
    });
    databaseMocks.commentCreate.mockResolvedValue(comment);
    databaseMocks.commentUpdate.mockResolvedValue(comment);
    databaseMocks.commentDelete.mockResolvedValue(comment);
    databaseMocks.activityFindMany.mockResolvedValue([activity]);
    databaseMocks.activityCreate.mockResolvedValue(activity);
    databaseMocks.notificationCreateMany.mockResolvedValue({ count: 1 });
    databaseMocks.transaction.mockImplementation(
      async (callback: (client: unknown) => unknown) => callback({
        comment: { create: databaseMocks.commentCreate },
        activityLog: { create: databaseMocks.activityCreate },
        notification: { createMany: databaseMocks.notificationCreateMany },
      }),
    );
  });

  it("requires authentication for comments and project activity", async () => {
    const comments = await request(createApp()).get(`/api/v1/tasks/${taskId}/comments`);
    const activities = await request(createApp()).get(`/api/v1/projects/${projectId}/activity`);

    expect(comments.status).toBe(401);
    expect(activities.status).toBe(401);
  });

  it("allows project members to list task comments", async () => {
    const response = await request(createApp())
      .get(`/api/v1/tasks/${taskId}/comments`)
      .set("Cookie", authCookie());

    expect(response.status).toBe(200);
    expect(response.body.data.comments[0]).toMatchObject({ id: commentId, userId });
    expect(databaseMocks.commentFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { taskId } }),
    );
  });

  it("does not expose comments for an inaccessible task", async () => {
    databaseMocks.membershipFindUnique.mockResolvedValue(null);

    const response = await request(createApp())
      .get(`/api/v1/tasks/${taskId}/comments`)
      .set("Cookie", authCookie());

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("PROJECT_NOT_FOUND");
    expect(databaseMocks.commentFindMany).not.toHaveBeenCalled();
  });

  it("creates a trimmed comment and COMMENT_ADDED activity atomically", async () => {
    const response = await request(createApp())
      .post(`/api/v1/tasks/${taskId}/comments`)
      .set("Cookie", authCookie())
      .set("Origin", "http://localhost:5173")
      .send({ content: "  The board is ready for review.  " });

    expect(response.status).toBe(201);
    expect(databaseMocks.commentCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ taskId, userId, content: comment.content }),
      }),
    );
    expect(databaseMocks.activityCreate).toHaveBeenCalledWith({
      data: {
        projectId,
        taskId,
        actorId: userId,
        action: "COMMENT_ADDED",
        metadata: { commentId: expect.any(String) },
      },
    });
    expect(databaseMocks.notificationCreateMany).toHaveBeenCalledWith({
      data: [{
        userId: otherUserId,
        type: "COMMENT_ADDED",
        title: "New task comment",
        message: `${user.name} commented on "Build the project board".`,
        projectId,
        taskId,
      }],
    });
    expect(databaseMocks.transaction).toHaveBeenCalledTimes(1);
  });

  it("rejects empty and whitespace-only comments", async () => {
    const response = await request(createApp())
      .post(`/api/v1/tasks/${taskId}/comments`)
      .set("Cookie", authCookie())
      .set("Origin", "http://localhost:5173")
      .send({ content: "   " });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(databaseMocks.taskFindUnique).not.toHaveBeenCalled();
    expect(databaseMocks.commentCreate).not.toHaveBeenCalled();
  });

  it("allows an author to edit their own comment", async () => {
    databaseMocks.commentUpdate.mockResolvedValue({ ...comment, content: "Updated comment" });

    const response = await request(createApp())
      .patch(`/api/v1/comments/${commentId}`)
      .set("Cookie", authCookie())
      .set("Origin", "http://localhost:5173")
      .send({ content: " Updated comment " });

    expect(response.status).toBe(200);
    expect(databaseMocks.commentUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { content: "Updated comment" } }),
    );
  });

  it("allows an author to delete their own comment", async () => {
    const response = await request(createApp())
      .delete(`/api/v1/comments/${commentId}`)
      .set("Cookie", authCookie())
      .set("Origin", "http://localhost:5173");

    expect(response.status).toBe(200);
    expect(databaseMocks.commentDelete).toHaveBeenCalledWith({ where: { id: commentId } });
  });

  it("prevents members from editing or deleting another user's comment", async () => {
    databaseMocks.commentFindUnique.mockResolvedValue({
      id: commentId,
      taskId,
      userId: otherUserId,
      task: { projectId },
    });

    const edit = await request(createApp())
      .patch(`/api/v1/comments/${commentId}`)
      .set("Cookie", authCookie())
      .set("Origin", "http://localhost:5173")
      .send({ content: "Unauthorized edit" });
    const remove = await request(createApp())
      .delete(`/api/v1/comments/${commentId}`)
      .set("Cookie", authCookie())
      .set("Origin", "http://localhost:5173");

    expect(edit.status).toBe(403);
    expect(remove.status).toBe(403);
    expect(databaseMocks.commentUpdate).not.toHaveBeenCalled();
    expect(databaseMocks.commentDelete).not.toHaveBeenCalled();
  });

  it("checks project access before disclosing comment ownership", async () => {
    databaseMocks.membershipFindUnique.mockResolvedValue(null);

    const response = await request(createApp())
      .patch(`/api/v1/comments/${commentId}`)
      .set("Cookie", authCookie())
      .set("Origin", "http://localhost:5173")
      .send({ content: "Unauthorized edit" });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("PROJECT_NOT_FOUND");
  });

  it("returns server-generated project activity to project members", async () => {
    const response = await request(createApp())
      .get(`/api/v1/projects/${projectId}/activity`)
      .set("Cookie", authCookie());

    expect(response.status).toBe(200);
    expect(response.body.data.activities[0]).toMatchObject({
      action: "COMMENT_ADDED",
      actor: { id: userId },
      task: { id: taskId },
    });
    expect(databaseMocks.activityFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { projectId }, take: 100 }),
    );
  });

  it("does not expose an endpoint for client-generated activity", async () => {
    const response = await request(createApp())
      .post(`/api/v1/projects/${projectId}/activity`)
      .set("Cookie", authCookie())
      .set("Origin", "http://localhost:5173")
      .send({ action: "PROJECT_CREATED", actorId: otherUserId });

    expect(response.status).toBe(404);
    expect(databaseMocks.activityCreate).not.toHaveBeenCalled();
  });

  it("validates a task activity filter belongs to the project", async () => {
    databaseMocks.taskFindFirst.mockResolvedValue(null);

    const response = await request(createApp())
      .get(`/api/v1/projects/${projectId}/activity?taskId=${taskId}`)
      .set("Cookie", authCookie());

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("TASK_NOT_FOUND");
    expect(databaseMocks.activityFindMany).not.toHaveBeenCalled();
  });

  it("does not expose project activity to outsiders", async () => {
    databaseMocks.membershipFindUnique.mockResolvedValue(null);

    const response = await request(createApp())
      .get(`/api/v1/projects/${projectId}/activity`)
      .set("Cookie", authCookie());

    expect(response.status).toBe(404);
    expect(databaseMocks.activityFindMany).not.toHaveBeenCalled();
  });

  it("rejects malformed comment and activity identifiers", async () => {
    const commentResponse = await request(createApp())
      .delete("/api/v1/comments/not-a-uuid")
      .set("Cookie", authCookie())
      .set("Origin", "http://localhost:5173");
    const activityResponse = await request(createApp())
      .get(`/api/v1/projects/${projectId}/activity?taskId=not-a-uuid`)
      .set("Cookie", authCookie());

    expect(commentResponse.status).toBe(422);
    expect(activityResponse.status).toBe(422);
  });
});
