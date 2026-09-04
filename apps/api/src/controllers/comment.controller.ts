import type { RequestHandler } from "express";
import {
  createTaskComment,
  deleteCommentById,
  listTaskComments,
  updateCommentById,
} from "../services/comment.service.js";
import {
  commentIdParamsSchema,
  createCommentSchema,
  taskCommentsParamsSchema,
  updateCommentSchema,
} from "../validators/comment.validators.js";

export const listComments: RequestHandler = async (request, response) => {
  const { taskId } = taskCommentsParamsSchema.parse(request.params);
  const comments = await listTaskComments(taskId, request.authUser!.id);
  response.status(200).json({ success: true, data: { comments } });
};

export const createComment: RequestHandler = async (request, response) => {
  const { taskId } = taskCommentsParamsSchema.parse(request.params);
  const input = createCommentSchema.parse(request.body);
  const comment = await createTaskComment(taskId, request.authUser!.id, input);
  response.status(201).json({ success: true, data: { comment } });
};

export const updateComment: RequestHandler = async (request, response) => {
  const { commentId } = commentIdParamsSchema.parse(request.params);
  const input = updateCommentSchema.parse(request.body);
  const comment = await updateCommentById(commentId, request.authUser!.id, input);
  response.status(200).json({ success: true, data: { comment } });
};

export const deleteComment: RequestHandler = async (request, response) => {
  const { commentId } = commentIdParamsSchema.parse(request.params);
  await deleteCommentById(commentId, request.authUser!.id);
  response.status(200).json({
    success: true,
    data: { message: "Comment deleted successfully." },
  });
};
