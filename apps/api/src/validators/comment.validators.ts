import { z } from "zod";

const commentContentSchema = z
  .string()
  .trim()
  .min(1, "Comment content is required.")
  .max(5000, "Comment content must contain at most 5000 characters.");

export const taskCommentsParamsSchema = z.object({
  taskId: z.uuid("Task ID must be a valid UUID."),
}).strict();

export const commentIdParamsSchema = z.object({
  commentId: z.uuid("Comment ID must be a valid UUID."),
}).strict();

export const createCommentSchema = z.object({ content: commentContentSchema }).strict();
export const updateCommentSchema = z.object({ content: commentContentSchema }).strict();

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
