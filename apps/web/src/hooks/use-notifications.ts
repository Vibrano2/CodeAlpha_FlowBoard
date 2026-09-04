import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notificationsQueryKey,
} from "../lib/notifications";
import type { NotificationCollection } from "../types/notification";

export const useNotifications = () =>
  useQuery({ queryKey: notificationsQueryKey, queryFn: getNotifications });

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: (notification) => {
      queryClient.setQueryData<NotificationCollection>(notificationsQueryKey, (current) => {
        if (!current) return current;
        const wasUnread = current.notifications.some(
          (item) => item.id === notification.id && !item.isRead,
        );
        return {
          notifications: current.notifications.map((item) =>
            item.id === notification.id ? notification : item,
          ),
          unreadCount: wasUnread ? Math.max(0, current.unreadCount - 1) : current.unreadCount,
        };
      });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.setQueryData<NotificationCollection>(notificationsQueryKey, (current) =>
        current
          ? {
              notifications: current.notifications.map((notification) => ({
                ...notification,
                isRead: true,
              })),
              unreadCount: 0,
            }
          : current,
      );
    },
  });
};
