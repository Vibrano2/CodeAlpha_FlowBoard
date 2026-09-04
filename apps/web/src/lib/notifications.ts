import type { Notification, NotificationCollection } from "../types/notification";
import { apiRequest } from "./api";

export const notificationsQueryKey = ["notifications"] as const;

export const getNotifications = async () => {
  const response = await apiRequest<{
    success: true;
    data: NotificationCollection;
  }>("/notifications");
  return response.data;
};

export const markNotificationRead = async (notificationId: string) => {
  const response = await apiRequest<{
    success: true;
    data: { notification: Notification };
  }>(`/notifications/${notificationId}/read`, { method: "PATCH" });
  return response.data.notification;
};

export const markAllNotificationsRead = async () => {
  const response = await apiRequest<{
    success: true;
    data: { updatedCount: number };
  }>("/notifications/read-all", { method: "PATCH" });
  return response.data.updatedCount;
};
