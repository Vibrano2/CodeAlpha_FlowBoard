import type { Task, TaskPriority, TaskStatus } from "../types/task";

export const taskColumns: Array<{ status: TaskStatus; label: string }> = [
  { status: "TODO", label: "To Do" },
  { status: "IN_PROGRESS", label: "In Progress" },
  { status: "REVIEW", label: "Review" },
  { status: "COMPLETED", label: "Completed" },
];

export const priorityLabels: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const priorityClasses: Record<TaskPriority, string> = {
  LOW: "border-slate-200 bg-slate-50 text-slate-600",
  MEDIUM: "border-blue-200 bg-blue-50 text-blue-700",
  HIGH: "border-amber-200 bg-amber-50 text-amber-800",
  URGENT: "border-red-200 bg-red-50 text-red-700",
};

export const getDuePresentation = (task: Pick<Task, "dueDate" | "status">) => {
  if (!task.dueDate) return null;

  const dueDate = new Date(task.dueDate);
  const formattedDate = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(dueDate);

  if (task.status === "COMPLETED") {
    return { date: formattedDate, state: "Completed", className: "text-emerald-700" };
  }

  const remaining = dueDate.getTime() - Date.now();
  if (remaining < 0) {
    return { date: formattedDate, state: "Overdue", className: "text-red-700" };
  }
  if (remaining <= 3 * 24 * 60 * 60 * 1000) {
    return { date: formattedDate, state: "Due soon", className: "text-amber-700" };
  }

  return { date: formattedDate, state: "Due", className: "text-slate-500" };
};

export const userInitials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
