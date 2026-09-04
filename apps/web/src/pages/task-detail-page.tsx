import { CalendarDays, CheckCircle2, Clock3, Trash2, UserRound } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ContentError, ContentLoader } from "../components/content-state";
import { ActivityList, ActivityLoader } from "../components/activity-list";
import { ProjectNavigation } from "../components/project-navigation";
import { TaskDiscussion } from "../components/task-discussion";
import { TaskForm } from "../components/task-form";
import { WorkspaceShell } from "../components/workspace-shell";
import { useProjectMembers } from "../hooks/use-members";
import { useProject } from "../hooks/use-projects";
import { useDeleteTask, useTask, useUpdateTask } from "../hooks/use-tasks";
import { useProjectActivity } from "../hooks/use-collaboration";
import { getDuePresentation, priorityClasses, priorityLabels } from "../lib/task-display";
import type { CreateTaskInput, UpdateTaskInput } from "../types/task";

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

export const TaskDetailPage = () => {
  const { taskId = "" } = useParams();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const taskQuery = useTask(taskId);
  const projectId = taskQuery.data?.projectId ?? "";
  const projectQuery = useProject(projectId);
  const membersQuery = useProjectMembers(projectId);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const activityQuery = useProjectActivity(projectId, taskId);
  const task = taskQuery.data;
  const due = task ? getDuePresentation(task) : null;
  const relatedDataIsLoading = Boolean(task) && (projectQuery.isPending || membersQuery.isPending);

  const handleUpdate = (input: CreateTaskInput | UpdateTaskInput) => {
    setSaved(false);
    updateTask.mutate({ taskId, projectId, input }, { onSuccess: () => setSaved(true) });
  };

  const handleDelete = () => {
    if (!task || !window.confirm(`Delete "${task.title}" permanently?`)) return;
    deleteTask.mutate({ taskId, projectId }, {
      onSuccess: () => navigate(`/projects/${projectId}/board`, { replace: true }),
    });
  };

  return (
    <WorkspaceShell>
      {(currentUser) => (
        <>
          {taskQuery.isPending || relatedDataIsLoading ? <ContentLoader /> : null}
          {taskQuery.isError ? <ContentError onRetry={() => void taskQuery.refetch()} /> : null}
          {task && projectQuery.data && membersQuery.data ? (
            <>
              <header>
                <Link className="text-sm font-semibold text-brand-600 hover:text-brand-700" to={`/projects/${projectId}/board`}>Back to {task.board.name}</Link>
                <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${priorityClasses[task.priority]}`}>{priorityLabels[task.priority]} priority</span>
                      {due ? <span className={`text-xs font-bold ${due.className}`}>{due.state}: {due.date}</span> : null}
                    </div>
                    <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{task.title}</h1>
                  </div>
                  <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-60" type="button" onClick={handleDelete} disabled={deleteTask.isPending}><Trash2 aria-hidden="true" size={17} />{deleteTask.isPending ? "Deleting..." : "Delete task"}</button>
                </div>
                <ProjectNavigation projectId={projectId} role={projectQuery.data.currentUserRole} />
              </header>

              {deleteTask.isError ? <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{deleteTask.error.message}</p> : null}

              <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
                <div className="space-y-6">
                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="edit-task-heading">
                    <div className="mb-6 flex items-center justify-between gap-3">
                      <div><h2 className="font-bold text-slate-950" id="edit-task-heading">Task details</h2><p className="mt-1 text-sm text-slate-500">Update the work, owner, priority, date, or status.</p></div>
                      {saved ? <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700" role="status"><CheckCircle2 aria-hidden="true" size={16} />Saved</span> : null}
                    </div>
                    <TaskForm task={task} members={membersQuery.data} isSubmitting={updateTask.isPending} errorMessage={updateTask.isError ? updateTask.error.message : undefined} submitLabel="Save task" onSubmit={handleUpdate} />
                  </section>
                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="task-activity-heading">
                    <h2 className="font-bold text-slate-950" id="task-activity-heading">Task activity</h2>
                    <div className="mt-5">
                      {activityQuery.isPending ? <ActivityLoader /> : null}
                      {activityQuery.isError ? <p className="text-sm text-red-700" role="alert">Could not load task activity. <button className="font-bold underline" type="button" onClick={() => void activityQuery.refetch()}>Try again</button></p> : null}
                      {activityQuery.data ? <ActivityList activities={activityQuery.data} emptyMessage="No task activity has been recorded yet." /> : null}
                    </div>
                  </section>
                </div>

                <aside className="space-y-6">
                  <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="font-bold text-slate-950">Task information</h2>
                    <dl className="mt-5 space-y-5">
                      <TaskFact icon={UserRound} label="Created by" value={task.creator.name} />
                      <TaskFact icon={CalendarDays} label="Created" value={formatDateTime(task.createdAt)} />
                      <TaskFact icon={Clock3} label="Last updated" value={formatDateTime(task.updatedAt)} />
                      {task.completedAt ? <TaskFact icon={CheckCircle2} label="Completed" value={formatDateTime(task.completedAt)} /> : null}
                    </dl>
                  </section>
                  <TaskDiscussion taskId={taskId} projectId={projectId} currentUserId={currentUser.id} />
                </aside>
              </div>
            </>
          ) : null}
          {task && (projectQuery.isError || membersQuery.isError) ? <ContentError onRetry={() => { void projectQuery.refetch(); void membersQuery.refetch(); }} /> : null}
        </>
      )}
    </WorkspaceShell>
  );
};

const TaskFact = ({ icon: Icon, label, value }: { icon: typeof UserRound; label: string; value: string }) => (
  <div className="flex items-start gap-3">
    <Icon className="mt-0.5 text-slate-400" aria-hidden="true" size={18} />
    <div><dt className="text-xs font-semibold text-slate-400">{label}</dt><dd className="mt-0.5 text-sm font-semibold text-slate-800">{value}</dd></div>
  </div>
);
