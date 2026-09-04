export type NotificationType =
  | "PROJECT_MEMBER_ADDED"
  | "TASK_ASSIGNED"
  | "TASK_STATUS_CHANGED"
  | "COMMENT_ADDED";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  projectId: string | null;
  taskId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationCollection {
  notifications: Notification[];
  unreadCount: number;
}
