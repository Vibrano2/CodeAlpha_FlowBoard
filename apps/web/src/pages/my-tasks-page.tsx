import { CalendarDays, CheckSquare2 } from "lucide-react";
import { Link } from "react-router-dom";
import { ContentError, ContentLoader } from "../components/content-state";
import { WorkspaceShell } from "../components/workspace-shell";
import { useAssignedTasks } from "../hooks/use-tasks";
import { getDuePresentation, priorityClasses, priorityLabels, taskColumns } from "../lib/task-display";

export const MyTasksPage = () => {
  const tasksQuery = useAssignedTasks();

  return (
    <WorkspaceShell>
      {() => (
        <>
          <header>
            <p className="text-sm font-semibold text-brand-600">My work</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">My tasks</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Tasks assigned to you across projects, ordered by due date.</p>
          </header>

          <div className="mt-7">
            {tasksQuery.isPending ? <ContentLoader /> : null}
            {tasksQuery.isError ? <ContentError onRetry={() => void tasksQuery.refetch()} /> : null}
            {tasksQuery.isSuccess && tasksQuery.data.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-500"><CheckSquare2 aria-hidden="true" size={24} /></span>
                <h2 className="mt-5 text-lg font-bold text-slate-950">No tasks assigned</h2>
                <p className="mt-2 text-sm text-slate-500">Tasks assigned to you will appear here.</p>
              </div>
            ) : null}
            {tasksQuery.data?.length ? (
              <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-label="Assigned tasks">
                {tasksQuery.data.map((task) => {
                  const due = getDuePresentation(task);
                  const status = taskColumns.find((column) => column.status === task.status)?.label ?? task.status;
                  return (
                    <li className="p-5 sm:px-6" key={task.id}>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-brand-600">{task.project.name}</p>
                          <Link className="mt-1 block truncate font-bold text-slate-900 hover:text-brand-700" to={`/tasks/${task.id}`}>{task.title}</Link>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                            <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-600">{status}</span>
                            <span className={`rounded-full border px-2 py-1 font-semibold ${priorityClasses[task.priority]}`}>{priorityLabels[task.priority]}</span>
                          </div>
                        </div>
                        {due ? <span className={`flex shrink-0 items-center gap-1.5 text-sm font-semibold ${due.className}`}><CalendarDays aria-hidden="true" size={16} />{due.state}: {due.date}</span> : <span className="text-sm text-slate-400">No due date</span>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        </>
      )}
    </WorkspaceShell>
  );
};
