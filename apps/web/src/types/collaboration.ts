import type { ProjectOwner } from "./project";

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: ProjectOwner;
}

export type ActivityAction =
  | "PROJECT_CREATED"
  | "MEMBER_ADDED"
  | "MEMBER_REMOVED"
  | "TASK_CREATED"
  | "TASK_ASSIGNED"
  | "TASK_STATUS_CHANGED"
  | "COMMENT_ADDED"
  | "TASK_COMPLETED";

export interface Activity {
  id: string;
  projectId: string;
  taskId: string | null;
  actorId: string;
  action: ActivityAction;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: ProjectOwner;
  task: { id: string; title: string } | null;
}
