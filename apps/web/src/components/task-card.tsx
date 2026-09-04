import { CalendarDays, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { getDuePresentation, priorityClasses, priorityLabels, taskColumns, userInitials } from "../lib/task-display";
import type { Task, TaskStatus } from "../types/task";

interface TaskCardProps {
  task: Task;
  isUpdating: boolean;
  onStatusChange: (status: TaskStatus) => void;
}

export const TaskCard = ({ task, isUpdating, onStatusChange }: TaskCardProps) => {
  const due = getDuePresentation(task);

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <Link className="font-semibold leading-5 text-slate-900 hover:text-brand-700 focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600" to={`/tasks/${task.id}`}>{task.title}</Link>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-bold ${priorityClasses[task.priority]}`}>{priorityLabels[task.priority]}</span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        {task.assignee ? (
          <div className="flex min-w-0 items-center gap-2" title={task.assignee.name}>
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600" aria-hidden="true">{userInitials(task.assignee.name)}</span>
            <span className="truncate text-xs font-medium text-slate-500">{task.assignee.name}</span>
          </div>
        ) : <span className="flex items-center gap-1.5 text-xs text-slate-400"><UserRound aria-hidden="true" size={14} />Unassigned</span>}
        {due ? <span className={`flex shrink-0 items-center gap-1 text-xs font-semibold ${due.className}`} title={due.date}><CalendarDays aria-hidden="true" size={14} />{due.state}</span> : null}
      </div>

      <label className="mt-4 block border-t border-slate-100 pt-3 text-xs font-semibold text-slate-500">
        <span className="sr-only">Status for {task.title}</span>
        <select className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:opacity-60" value={task.status} onChange={(event) => onStatusChange(event.target.value as TaskStatus)} disabled={isUpdating} aria-label={`Status for ${task.title}`}>
          {taskColumns.map((column) => <option value={column.status} key={column.status}>{column.label}</option>)}
        </select>
      </label>
    </article>
  );
};
