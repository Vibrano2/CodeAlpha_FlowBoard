import { CalendarClock, CheckSquare2, FolderKanban, Plus, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import { ContentError, ContentLoader } from "../components/content-state";
import { HealthCard } from "../components/health-card";
import { ProjectCard } from "../components/project-card";
import { WorkspaceShell } from "../components/workspace-shell";
import { useProjects } from "../hooks/use-projects";
import { useAssignedTasks } from "../hooks/use-tasks";

export const DashboardPage = () => {
  const projectsQuery = useProjects();
  const assignedTasksQuery = useAssignedTasks();

  return (
    <WorkspaceShell>
      {(user) => {
        const projects = projectsQuery.data ?? [];
        const ownedCount = projects.filter((project) => project.currentUserRole === "OWNER").length;
        const sharedCount = projects.length - ownedCount;
        const activeAssignedTasks = (assignedTasksQuery.data ?? []).filter((task) => task.status !== "COMPLETED");
        const now = Date.now();
        const upcomingCount = activeAssignedTasks.filter((task) => {
          if (!task.dueDate) return false;
          const due = new Date(task.dueDate).getTime();
          return due >= now && due <= now + 7 * 24 * 60 * 60 * 1000;
        }).length;
        const overdueCount = activeAssignedTasks.filter((task) => task.dueDate && new Date(task.dueDate).getTime() < now).length;

        return (
          <>
            <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-brand-600">Dashboard</p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Welcome, {user.name.split(" ")[0]}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">Your projects, assigned work, and upcoming deadlines stay organized here.</p>
              </div>
              <Link className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600" to="/projects/new">
                <Plus aria-hidden="true" size={18} /> Create project
              </Link>
            </header>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <DashboardStat icon={FolderKanban} label="Projects I own" value={projectsQuery.isSuccess ? String(ownedCount) : "..."} />
              <DashboardStat icon={UsersRound} label="Shared with me" value={projectsQuery.isSuccess ? String(sharedCount) : "..."} />
              <DashboardStat icon={CheckSquare2} label="Tasks assigned to me" value={assignedTasksQuery.isError ? "Unavailable" : assignedTasksQuery.isSuccess ? String(activeAssignedTasks.length) : "..."} />
              <DashboardStat icon={CalendarClock} label="Upcoming due dates" value={assignedTasksQuery.isError ? "Unavailable" : assignedTasksQuery.isSuccess ? String(upcomingCount) : "..."} note={assignedTasksQuery.isSuccess && overdueCount > 0 ? `${overdueCount} overdue` : undefined} />
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.65fr)]">
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-950">My projects</h2>
                  {projects.length > 0 ? <Link className="text-sm font-semibold text-brand-600 hover:text-brand-700" to="/projects">View all</Link> : null}
                </div>

                {projectsQuery.isPending ? <ContentLoader /> : null}
                {projectsQuery.isError ? <ContentError onRetry={() => void projectsQuery.refetch()} /> : null}
                {projectsQuery.isSuccess && projects.length === 0 ? <ProjectEmptyState /> : null}
                {projects.length > 0 ? (
                  <div className="grid gap-5 md:grid-cols-2">{projects.slice(0, 4).map((project) => <ProjectCard project={project} key={project.id} />)}</div>
                ) : null}
              </section>
              <HealthCard />
            </div>
          </>
        );
      }}
    </WorkspaceShell>
  );
};

const DashboardStat = ({ icon: Icon, label, value, note }: { icon: typeof FolderKanban; label: string; value: string; note?: string }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon aria-hidden="true" size={20} /></span>
    <h2 className="mt-4 text-sm font-semibold text-slate-500">{label}</h2>
    <p className={`mt-1 font-bold text-slate-950 ${/^\d+$/.test(value) ? "text-2xl" : "text-sm"}`}>{value}</p>
    {note ? <p className="mt-1 text-xs font-bold text-red-700">{note}</p> : null}
  </section>
);

const ProjectEmptyState = () => (
  <div className="rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-10">
    <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-500"><FolderKanban aria-hidden="true" size={24} /></span>
    <h2 className="mt-5 text-lg font-bold text-slate-950">No projects yet</h2>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Create your first project and FlowBoard will set up its owner membership and main board automatically.</p>
    <Link className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600" to="/projects/new"><Plus aria-hidden="true" size={17} />Create project</Link>
  </div>
);
