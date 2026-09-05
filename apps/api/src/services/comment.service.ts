import { ActivityAction, NotificationType, Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { prisma } from "../database/prisma.js";
import { publishRealtimeEvent } from "../realtime/realtime-events.js";
import { AppError } from "../utils/app-error.js";
import type {
  CreateCommentInput,
  UpdateCommentInput,
} from "../validators/comment.validators.js";
import { requireProjectMember } from "./project-access.service.js";

const commentSelect = {
  id: true,
  taskId: true,
  userId: true,
  content: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: { id: true, name: true, email: true, avatarUrl: true },
  },
} satisfies Prisma.CommentSelect;

const loadAuthorizedTask = async (taskId: string, actorId: string) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      projectId: true,
      title: true,
      createdBy: true,
      assigneeId: true,
    },
  });

  if (!task) {
    throw new AppError(404, "TASK_NOT_FOUND", "Task was not found.");
  }

  await requireProjectMember(task.projectId, actorId);
  return task;
};

const loadAuthorizedComment = async (commentId: string, actorId: string) => {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      taskId: true,
      userId: true,
      task: { select: { projectId: true } },
    },
  });

  if (!comment) {
    throw new AppError(404, "COMMENT_NOT_FOUND", "Comment was not found.");
  }

  await requireProjectMember(comment.task.projectId, actorId);

  if (comment.userId !== actorId) {
    throw new AppError(
      403,
      "COMMENT_AUTHOR_REQUIRED",
      "Only the comment author can change this comment.",
    );
  }

  return comment;
};

const mapMissingComment = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    throw new AppError(404, "COMMENT_NOT_FOUND", "Comment was not found.");
  }

  throw error;
};

export const listTaskComments = async (taskId: string, actorId: string) => {
  await loadAuthorizedTask(taskId, actorId);

  return prisma.comment.findMany({
    where: { taskId },
    orderBy: { createdAt: "asc" },
    select: commentSelect,
  });
};

export const createTaskComment = async (
  taskId: string,
  actorId: string,
  input: CreateCommentInput,
) => {
  const task = await loadAuthorizedTask(taskId, actorId);
  const commentId = randomUUID();

  const comment = await prisma.$transaction(async (transaction) => {
    const comment = await transaction.comment.create({
      data: {
        id: commentId,
        taskId,
        userId: actorId,
        content: input.content,
      },
      select: commentSelect,
    });

    await transaction.activityLog.create({
      data: {
        projectId: task.projectId,
        taskId,
        actorId,
        action: ActivityAction.COMMENT_ADDED,
        metadata: { commentId },
      },
    });

    const recipients = [task.assigneeId, task.createdBy].filter(
      (userId, index, values): userId is string =>
        Boolean(userId) && userId !== actorId && values.indexOf(userId) === index,
    );

    if (recipients.length > 0) {
      await transaction.notification.createMany({
        data: recipients.map((userId) => ({
          userId,
          type: NotificationType.COMMENT_ADDED,
          title: "New task comment",
          message: `${comment.user.name} commented on "${task.title}".`,
          projectId: task.projectId,
          taskId,
        })),
      });
    }

    return comment;
  });

  publishRealtimeEvent({
    type: "comment:created",
    projectId: task.projectId,
    taskId,
    commentId: comment.id,
  });
  const notificationUserIds = [task.assigneeId, task.createdBy].filter(
    (userId, index, values): userId is string =>
      Boolean(userId) && userId !== actorId && values.indexOf(userId) === index,
  );
  if (notificationUserIds.length > 0) {
    publishRealtimeEvent({ type: "notification:changed", userIds: notificationUserIds });
  }

  return comment;
};

export const updateCommentById = async (
  commentId: string,
  actorId: string,
  input: UpdateCommentInput,
) => {
  const existingComment = await loadAuthorizedComment(commentId, actorId);

  try {
    const comment = await prisma.comment.update({
      where: { id: commentId },
      data: { content: input.content },
      select: commentSelect,
    });
    publishRealtimeEvent({
      type: "comment:updated",
      projectId: existingComment.task.projectId,
      taskId: existingComment.taskId,
      commentId,
    });
    return comment;
  } catch (error) {
    return mapMissingComment(error);
  }
};

export const deleteCommentById = async (commentId: string, actorId: string) => {
  const comment = await loadAuthorizedComment(commentId, actorId);

  try {
    await prisma.comment.delete({ where: { id: commentId } });
    publishRealtimeEvent({
      type: "comment:deleted",
      projectId: comment.task.projectId,
      taskId: comment.taskId,
      commentId,
    });
  } catch (error) {
    mapMissingComment(error);
  }
};
