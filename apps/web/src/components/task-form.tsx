import { type FormEvent, useState } from "react";
import type { ProjectMember } from "../types/project";
import type { CreateTaskInput, Task, TaskPriority, TaskStatus, UpdateTaskInput } from "../types/task";
import { taskColumns } from "../lib/task-display";

interface TaskFormProps {
  members: ProjectMember[];
  task?: Task;
  isSubmitting: boolean;
  errorMessage?: string;
  submitLabel: string;
  onCancel?: () => void;
  onSubmit: (input: CreateTaskInput | UpdateTaskInput) => void;
}

const toDateInput = (dueDate: string | null | undefined) => dueDate?.slice(0, 10) ?? "";
const toApiDueDate = (dueDate: string) =>
  dueDate ? `${dueDate}T23:59:59.999Z` : null;

export const TaskForm = ({
  members,
  task,
  isSubmitting,
  errorMessage,
  submitLabel,
  onCancel,
  onSubmit,
}: TaskFormProps) => {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "TODO");
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "MEDIUM");
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId ?? "");
  const [dueDate, setDueDate] = useState(toDateInput(task?.dueDate));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      ...(task ? { status } : {}),
      priority,
      assigneeId: assigneeId || null,
      dueDate: toApiDueDate(dueDate),
    });
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {errorMessage ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{errorMessage}</p> : null}
      <div>
        <label className="text-sm font-semibold text-slate-700" htmlFor="task-title">Task title</label>
        <input className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100" id="task-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} required autoFocus={!task} />
      </div>
      <div>
        <label className="text-sm font-semibold text-slate-700" htmlFor="task-description">Description</label>
        <textarea className="mt-2 min-h-28 w-full resize-y rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100" id="task-description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={5000} placeholder="Add context, requirements, or a definition of done." />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {task ? (
          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="task-status">Status</label>
            <select className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100" id="task-status" value={status} onChange={(event) => setStatus(event.target.value as TaskStatus)}>
              {taskColumns.map((column) => <option value={column.status} key={column.status}>{column.label}</option>)}
            </select>
          </div>
        ) : null}
        <div>
          <label className="text-sm font-semibold text-slate-700" htmlFor="task-priority">Priority</label>
          <select className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100" id="task-priority" value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700" htmlFor="task-assignee">Assignee</label>
          <select className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100" id="task-assignee" value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)}>
            <option value="">Unassigned</option>
            {members.map((member) => <option value={member.userId} key={member.userId}>{member.user.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700" htmlFor="task-due-date">Due date</label>
          <input className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100" id="task-due-date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
        </div>
      </div>
      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
        {onCancel ? <button className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600" type="button" onClick={onCancel}>Cancel</button> : null}
        <button className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-60" type="submit" disabled={isSubmitting || !title.trim()}>{isSubmitting ? "Saving..." : submitLabel}</button>
      </div>
    </form>
  );
};
