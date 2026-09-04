import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const userId = "708fe7a5-4696-43b4-bdf1-4ef5e19f845a";
const otherUserId = "d5f6070d-d0bb-4cf1-86dc-680fcfe0556d";
const projectId = "f9534ad1-f82a-414f-ae76-b2655d881f6d";
const taskId = "d56d146a-d851-49d4-b205-6397d4a3a789";
const notificationId = "fd9fcd20-ff98-4fd3-8945-a0c503b65e09";
const now = new Date("2026-09-04T21:00:00.000Z");

const databaseMocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  notificationFindMany: vi.fn(),
  notificationCount: vi.fn(),
  notificationFindFirst: vi.fn(),
  notificationUpdate: vi.fn(),
  notificationUpdateMany: vi.fn(),
  queryRaw: vi.fn().mockResolvedValue([{ result: 1 }]),
}));

vi.mock("../database/prisma.js", () => ({
  prisma: {
    $queryRaw: databaseMocks.queryRaw,
    user: { findUnique: databaseMocks.userFindUnique },
    notification: {
      findMany: databaseMocks.notificationFindMany,
      count: databaseMocks.notificationCount,
      findFirst: databaseMocks.notificationFindFirst,
      update: databaseMocks.notificationUpdate,
      updateMany: databaseMocks.notificationUpdateMany,
    },
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

const notification = {
  id: notificationId,
  userId,
  type: "TASK_ASSIGNED",
  title: "New task assignment",
  message: "You were assigned a task.",
  projectId,
  taskId,
  isRead: false,
  createdAt: now,
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

describe("notification API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    databaseMocks.userFindUnique.mockResolvedValue(user);
    databaseMocks.notificationFindMany.mockResolvedValue([notification]);
    databaseMocks.notificationCount.mockResolvedValue(1);
    databaseMocks.notificationFindFirst.mockResolvedValue({ id: notificationId });
    databaseMocks.notificationUpdate.mockResolvedValue({ ...notification, isRead: true });
    databaseMocks.notificationUpdateMany.mockResolvedValue({ count: 2 });
  });

  it("requires authentication", async () => {
    const response = await request(createApp()).get("/api/v1/notifications");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("lists only the current user's notifications and unread count", async () => {
    const response = await request(createApp())
      .get("/api/v1/notifications")
      .set("Cookie", authCookie());

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ unreadCount: 1 });
    expect(response.body.data.notifications[0].id).toBe(notificationId);
    expect(databaseMocks.notificationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId }, take: 100 }),
    );
    expect(databaseMocks.notificationCount).toHaveBeenCalledWith({
      where: { userId, isRead: false },
    });
  });

  it("marks an owned notification as read", async () => {
    const response = await request(createApp())
      .patch(`/api/v1/notifications/${notificationId}/read`)
      .set("Cookie", authCookie())
      .set("Origin", "http://localhost:5173");

    expect(response.status).toBe(200);
    expect(response.body.data.notification.isRead).toBe(true);
    expect(databaseMocks.notificationFindFirst).toHaveBeenCalledWith({
      where: { id: notificationId, userId },
      select: { id: true },
    });
    expect(databaseMocks.notificationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: notificationId }, data: { isRead: true } }),
    );
  });

  it("does not expose or update another user's notification", async () => {
    databaseMocks.notificationFindFirst.mockResolvedValue(null);

    const response = await request(createApp())
      .patch(`/api/v1/notifications/${notificationId}/read`)
      .set("Cookie", authCookie())
      .set("Origin", "http://localhost:5173");

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("NOTIFICATION_NOT_FOUND");
    expect(databaseMocks.notificationUpdate).not.toHaveBeenCalled();
  });

  it("marks only the current user's unread notifications as read", async () => {
    const response = await request(createApp())
      .patch("/api/v1/notifications/read-all")
      .set("Cookie", authCookie())
      .set("Origin", "http://localhost:5173");

    expect(response.status).toBe(200);
    expect(response.body.data.updatedCount).toBe(2);
    expect(databaseMocks.notificationUpdateMany).toHaveBeenCalledWith({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  });

  it("rejects malformed notification IDs", async () => {
    const response = await request(createApp())
      .patch("/api/v1/notifications/not-a-uuid/read")
      .set("Cookie", authCookie())
      .set("Origin", "http://localhost:5173");

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(databaseMocks.notificationFindFirst).not.toHaveBeenCalled();
  });

  it("does not expose an endpoint for arbitrary notification creation", async () => {
    const response = await request(createApp())
      .post("/api/v1/notifications")
      .set("Cookie", authCookie())
      .set("Origin", "http://localhost:5173")
      .send({ userId: otherUserId, type: "TASK_ASSIGNED" });

    expect(response.status).toBe(404);
  });
});
