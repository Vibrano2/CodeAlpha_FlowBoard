import { Columns3, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ContentError, ContentLoader } from "../components/content-state";
import { ProjectNavigation } from "../components/project-navigation";
import { TaskCard } from "../components/task-card";
import { TaskForm } from "../components/task-form";
import { useToast } from "../components/toast";
import { WorkspaceShell } from "../components/workspace-shell";
import { useProjectMembers } from "../hooks/use-members";
import { useProject } from "../hooks/use-projects";
import { useCreateTask, useProjectBoard, useProjectTasks, useUpdateTaskStatus } from "../hooks/use-tasks";
import { priorityLabels, taskColumns } from "../lib/task-display";
import type {
  CreateTaskInput,
  TaskDueState,
  TaskFilters,
  TaskPriority,
  TaskStatus,
  UpdateTaskInput,
} from "../types/task";

const priorities: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export const ProjectBoardPage = () => {
  const { projectId = "" } = useParams();
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TaskStatus | "">("");
  const [priority, setPriority] = useState<TaskPriority | "">("");
  const [assigneeId, setAssigneeId] = useState("");
  const [due, setDue] = useState<TaskDueState | "">("");
  const filters = useMemo<TaskFilters>(
    () => ({
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(assigneeId ? { assigneeId } : {}),
      ...(due ? { due } : {}),
    }),
    [assigneeId, due, priority, search, status],
  );
  const hasActiveFilters = Object.keys(filters).length > 0;
  const projectQuery = useProject(projectId);
  const boardQuery = useProjectBoard(projectId);
  const tasksQuery = useProjectTasks(projectId, filters);
  const membersQuery = useProjectMembers(projectId);
  const createTask = useCreateTask();
  const updateStatus = useUpdateTaskStatus();
  const { showToast } = useToast();

  const queries = [projectQuery, boardQuery, tasksQuery, membersQuery];
  const isLoading = queries.some((query) => query.isPending);
  const hasError = queries.some((query) => query.isError);

  const handleCreate = (input: CreateTaskInput | UpdateTaskInput) => {
    createTask.mutate({ projectId, input: input as CreateTaskInput }, {
      onSuccess: () => {
        setShowCreateTask(false);
        showToast({ title: "Task created" });
      },
    });
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setPriority("");
    setAssigneeId("");
    setDue("");
  };

  return (
    <WorkspaceShell>
      {() => (
        <>
          {isLoading ? <ContentLoader /> : null}
          {hasError ? <ContentError onRetry={() => queries.forEach((query) => { void query.refetch(); })} /> : null}
          {projectQuery.data && boardQuery.data && tasksQuery.data && membersQuery.data ? (
            <>
              <header>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <Link className="text-sm font-semibold text-brand-600 hover:text-brand-700" to={`/projects/${projectId}`}>{projectQuery.data.name}</Link>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{boardQuery.data.name}</h1>
                    <p className="mt-2 text-sm leading-6 text-slate-600">Move work through each stage using the status control on every card.</p>
                  </div>
                  <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600" type="button" onClick={() => setShowCreateTask((visible) => !visible)} aria-expanded={showCreateTask}>
                    <Plus aria-hidden="true" size={18} />New task
                  </button>
                </div>
                <ProjectNavigation projectId={projectId} role={projectQuery.data.currentUserRole} />
              </header>

              {showCreateTask ? (
                <section className="mt-6 rounded-2xl border border-brand-100 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="create-task-heading">
                  <div className="mb-5 flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><Plus aria-hidden="true" size={20} /></span>
                    <div><h2 className="font-bold text-slate-950" id="create-task-heading">Create a task</h2><p className="text-sm text-slate-500">New tasks start in To Do.</p></div>
                  </div>
                  <TaskForm members={membersQuery.data} isSubmitting={createTask.isPending} errorMessage={createTask.isError ? createTask.error.message : undefined} submitLabel="Create task" onCancel={() => setShowCreateTask(false)} onSubmit={handleCreate} />
                </section>
              ) : null}

              <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" aria-labelledby="task-filters-heading">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="text-slate-500" aria-hidden="true" size={18} />
                    <h2 className="text-sm font-bold text-slate-900" id="task-filters-heading">Find tasks</h2>
                    {tasksQuery.data ? <span className="text-xs font-semibold text-slate-500">{tasksQuery.data.length} results</span> : null}
                  </div>
                  {hasActiveFilters ? (
                    <button className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-slate-600 hover:text-slate-900 focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 sm:self-auto" type="button" onClick={clearFilters}>
                      <X aria-hidden="true" size={16} />Clear filters
                    </button>
                  ) : null}
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  <label className="relative block sm:col-span-2 xl:col-span-1">
                    <span className="sr-only">Search tasks</span>
                    <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" size={17} />
                    <input className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by title" aria-label="Search tasks" />
                  </label>
                  <label>
                    <span className="sr-only">Status filter</span>
                    <select className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100" value={status} onChange={(event) => setStatus(event.target.value as TaskStatus | "")} aria-label="Status filter">
                      <option value="">All statuses</option>
                      {taskColumns.map((column) => <option value={column.status} key={column.status}>{column.label}</option>)}
                    </select>
                  </label>
                  <label>
                    <span className="sr-only">Priority filter</span>
                    <select className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100" value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority | "")} aria-label="Priority filter">
                      <option value="">All priorities</option>
                      {priorities.map((value) => <option value={value} key={value}>{priorityLabels[value]}</option>)}
                    </select>
                  </label>
                  <label>
                    <span className="sr-only">Assignee filter</span>
                    <select className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100" value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)} aria-label="Assignee filter">
                      <option value="">All assignees</option>
                      <option value="unassigned">Unassigned</option>
                      {membersQuery.data?.map((member) => <option value={member.userId} key={member.userId}>{member.user.name}</option>)}
                    </select>
                  </label>
                  <label>
                    <span className="sr-only">Due date filter</span>
                    <select className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100" value={due} onChange={(event) => setDue(event.target.value as TaskDueState | "")} aria-label="Due date filter">
                      <option value="">Any due date</option>
                      <option value="overdue">Overdue</option>
                      <option value="due_soon">Due soon</option>
                      <option value="no_due_date">No due date</option>
                    </select>
                  </label>
                </div>
              </section>

              {updateStatus.isError ? <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{updateStatus.error.message}</p> : null}

              {tasksQuery.data.length === 0 ? (
                <div className="mt-6 flex items-start gap-3 rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
                  <Columns3 className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" size={20} />
                  {hasActiveFilters ? (
                    <p><strong className="text-slate-900">No matching tasks.</strong> Adjust or clear the filters to see other work.</p>
                  ) : (
                    <p><strong className="text-slate-900">No tasks yet.</strong> Create the first task to begin organizing this project.</p>
                  )}
                </div>
              ) : null}

              <div className="mt-6 overflow-x-auto pb-4 focus-visible:rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600" tabIndex={0} role="region" aria-label="Kanban board. Scroll horizontally to view all columns.">
                <div className="grid min-w-[1160px] grid-cols-4 gap-4 xl:min-w-0">
                  {taskColumns.map((column) => {
                    const columnTasks = tasksQuery.data.filter((task) => task.status === column.status);
                    return (
                      <section className="rounded-2xl bg-slate-100/80 p-3" aria-labelledby={`column-${column.status}`} key={column.status}>
                        <header className="flex items-center justify-between px-1 py-2">
                          <h2 className="text-sm font-bold text-slate-800" id={`column-${column.status}`}>{column.label}</h2>
                          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-500">{columnTasks.length}</span>
                        </header>
                        <div className="mt-2 space-y-3">
                          {columnTasks.map((task) => (
                            <TaskCard
                              task={task}
                              key={task.id}
                              isUpdating={updateStatus.isPending && updateStatus.variables?.taskId === task.id}
                              onStatusChange={(status) => updateStatus.mutate(
                                { taskId: task.id, projectId, status },
                                {
                                  onSuccess: () => showToast({
                                    title: `Task moved to ${taskColumns.find((item) => item.status === status)?.label ?? status}`,
                                  }),
                                },
                              )}
                            />
                          ))}
                          {columnTasks.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 px-3 py-8 text-center text-xs text-slate-400">No tasks</p> : null}
                        </div>
                      </section>
                    );
                  })}
                </div>
              </div>
            </>
          ) : null}
        </>
      )}
    </WorkspaceShell>
  );
};
