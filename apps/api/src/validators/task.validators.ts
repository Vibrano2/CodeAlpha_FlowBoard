import { z } from "zod";

export const taskStatuses = ["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED"] as const;
export const taskPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export const taskDueStates = ["overdue", "due_soon", "no_due_date"] as const;

const taskTitleSchema = z
  .string()
  .trim()
  .min(1, "Task title is required.")
  .max(200, "Task title must contain at most 200 characters.");

const taskDescriptionSchema = z
  .string()
  .trim()
  .max(5000, "Task description must contain at most 5000 characters.")
  .nullable();

const taskStatusSchema = z.enum(taskStatuses, {
  error: "Task status must be TODO, IN_PROGRESS, REVIEW, or COMPLETED.",
});

const taskPrioritySchema = z.enum(taskPriorities, {
  error: "Task priority must be LOW, MEDIUM, HIGH, or URGENT.",
});

const assigneeIdSchema = z.uuid("Assignee ID must be a valid UUID.").nullable();

const dueDateSchema = z
  .union([z.iso.datetime({ offset: true }), z.null()])
  .transform((value) => (value === null ? null : new Date(value)));

export const taskProjectParamsSchema = z.object({
  projectId: z.uuid("Project ID must be a valid UUID."),
}).strict();

export const taskIdParamsSchema = z.object({
  taskId: z.uuid("Task ID must be a valid UUID."),
}).strict();

export const listTasksQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(200, "Task search must contain at most 200 characters.")
    .optional()
    .transform((value) => value || undefined),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  assigneeId: z
    .union([z.uuid("Assignee ID must be a valid UUID."), z.literal("unassigned")])
    .optional(),
  due: z.enum(taskDueStates).optional(),
}).strict();

export const createTaskSchema = z.object({
  title: taskTitleSchema,
  description: taskDescriptionSchema.optional(),
  priority: taskPrioritySchema.optional(),
  assigneeId: assigneeIdSchema.optional(),
  dueDate: dueDateSchema.optional(),
}).strict();

export const updateTaskSchema = z
  .object({
    title: taskTitleSchema.optional(),
    description: taskDescriptionSchema.optional(),
    status: taskStatusSchema.optional(),
    priority: taskPrioritySchema.optional(),
    assigneeId: assigneeIdSchema.optional(),
    dueDate: dueDateSchema.optional(),
  })
  .strict()
  .refine((input) => Object.values(input).some((value) => value !== undefined), {
    message: "Provide at least one task field to update.",
  });

export const updateTaskStatusSchema = z.object({ status: taskStatusSchema }).strict();
export const updateTaskAssigneeSchema = z.object({ assigneeId: assigneeIdSchema }).strict();

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
