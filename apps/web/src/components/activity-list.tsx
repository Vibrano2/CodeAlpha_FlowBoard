import { Activity as ActivityIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { taskColumns, userInitials } from "../lib/task-display";
import type { Activity } from "../types/collaboration";

const statusLabel = (status: unknown) =>
  typeof status === "string"
    ? taskColumns.find((column) => column.status === status)?.label ?? status
    : "another status";

const activityText = (activity: Activity) => {
  switch (activity.action) {
    case "PROJECT_CREATED": return "created the project";
    case "MEMBER_ADDED": return "added a project member";
    case "MEMBER_REMOVED": return "removed a project member";
    case "TASK_CREATED": return "created a task";
    case "TASK_ASSIGNED": return "assigned a task";
    case "TASK_STATUS_CHANGED": return `changed task status from ${statusLabel(activity.metadata?.from)} to ${statusLabel(activity.metadata?.to)}`;
    case "COMMENT_ADDED": return "added a comment";
    case "TASK_COMPLETED": return "completed a task";
  }
};

export const ActivityList = ({ activities, emptyMessage = "No activity has been recorded yet." }: { activities: Activity[]; emptyMessage?: string }) => {
  if (activities.length === 0) {
    return <p className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">{emptyMessage}</p>;
  }

  return (
    <ol className="space-y-4" aria-label="Activity history">
      {activities.map((activity) => (
        <li className="flex gap-3" key={activity.id}>
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600" aria-hidden="true">{userInitials(activity.actor.name)}</span>
          <div className="min-w-0 flex-1 border-b border-slate-100 pb-4">
            <p className="text-sm leading-6 text-slate-600"><strong className="font-bold text-slate-900">{activity.actor.name}</strong> {activityText(activity)}{activity.task ? <> on <Link className="font-semibold text-brand-700 hover:text-brand-800" to={`/tasks/${activity.task.id}`}>{activity.task.title}</Link></> : null}.</p>
            <time className="mt-1 block text-xs text-slate-400" dateTime={activity.createdAt}>{new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(activity.createdAt))}</time>
          </div>
        </li>
      ))}
    </ol>
  );
};

export const ActivityLoader = () => (
  <p className="flex items-center gap-2 text-sm text-slate-500" role="status"><ActivityIcon className="animate-pulse" aria-hidden="true" size={17} />Loading activity...</p>
);
