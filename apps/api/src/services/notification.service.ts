import { Prisma } from "@prisma/client";
import { prisma } from "../database/prisma.js";
import { AppError } from "../utils/app-error.js";

const notificationSelect = {
  id: true,
  userId: true,
  type: true,
  title: true,
  message: true,
  projectId: true,
  taskId: true,
  isRead: true,
  createdAt: true,
} satisfies Prisma.NotificationSelect;

export const listUserNotifications = async (userId: string) => {
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: notificationSelect,
    }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return { notifications, unreadCount };
};

export const markNotificationRead = async (notificationId: string, userId: string) => {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
    select: { id: true },
  });

  if (!notification) {
    throw new AppError(404, "NOTIFICATION_NOT_FOUND", "Notification was not found.");
  }

  try {
    return await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
      select: notificationSelect,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new AppError(404, "NOTIFICATION_NOT_FOUND", "Notification was not found.");
    }

    throw error;
  }
};

export const markAllNotificationsRead = async (userId: string) => {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  return result.count;
};
