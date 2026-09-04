import { CalendarDays, Columns3, Settings, UserRound, UsersRound } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { ContentError, ContentLoader } from "../components/content-state";
import { ProjectNavigation } from "../components/project-navigation";
import { WorkspaceShell } from "../components/workspace-shell";
import { useProject } from "../hooks/use-projects";

export const ProjectOverviewPage = () => {
  const { projectId = "" } = useParams();
  const projectQuery = useProject(projectId);

  return (
    <WorkspaceShell>
      {() => (
        <>
          {projectQuery.isPending ? <ContentLoader /> : null}
          {projectQuery.isError ? <ContentError onRetry={() => void projectQuery.refetch()} /> : null}
          {projectQuery.data ? (
            <>
              <header>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <Link className="text-sm font-semibold text-brand-600 hover:text-brand-700" to="/projects">Projects</Link>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{projectQuery.data.name}</h1>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{projectQuery.data.description || "No project description has been added yet."}</p>
                  </div>
                  {projectQuery.data.currentUserRole === "OWNER" ? <Link className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600" to={`/projects/${projectId}/settings`}><Settings aria-hidden="true" size={17} />Project settings</Link> : null}
                </div>
                <ProjectNavigation projectId={projectId} role={projectQuery.data.currentUserRole} />
              </header>

              <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.6fr)]">
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                  <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">Workspace</p>
                  <div className="mt-5 flex items-start gap-4 rounded-2xl border border-brand-100 bg-brand-50 p-5">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-brand-700 shadow-sm"><Columns3 aria-hidden="true" size={22} /></span>
                    <div>
                      <h2 className="font-bold text-slate-950">{projectQuery.data.board?.name ?? "Project Board"}</h2>
                      <p className="mt-1 text-sm leading-6 text-slate-600">Your Kanban columns and task cards will become available in Milestone 5.</p>
                    </div>
                  </div>
                </section>

                <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="font-bold text-slate-950">Project details</h2>
                  <dl className="mt-5 space-y-5">
                    <Detail icon={UserRound} label="Owner" value={projectQuery.data.owner.name} />
                    <Detail icon={UsersRound} label="Members" value={`${projectQuery.data._count.members}`} />
                    <Detail icon={CalendarDays} label="Created" value={new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(projectQuery.data.createdAt))} />
                  </dl>
                </aside>
              </div>
            </>
          ) : null}
        </>
      )}
    </WorkspaceShell>
  );
};

const Detail = ({ icon: Icon, label, value }: { icon: typeof UserRound; label: string; value: string }) => (
  <div className="flex items-start gap-3">
    <Icon className="mt-0.5 text-slate-400" aria-hidden="true" size={18} />
    <div><dt className="text-xs font-semibold text-slate-400">{label}</dt><dd className="mt-0.5 text-sm font-semibold text-slate-800">{value}</dd></div>
  </div>
);
