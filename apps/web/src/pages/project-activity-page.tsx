import { Activity } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { ActivityList } from "../components/activity-list";
import { ContentError, ContentLoader } from "../components/content-state";
import { ProjectNavigation } from "../components/project-navigation";
import { WorkspaceShell } from "../components/workspace-shell";
import { useProjectActivity } from "../hooks/use-collaboration";
import { useProject } from "../hooks/use-projects";

export const ProjectActivityPage = () => {
  const { projectId = "" } = useParams();
  const projectQuery = useProject(projectId);
  const activityQuery = useProjectActivity(projectId);
  const isLoading = projectQuery.isPending || activityQuery.isPending;
  const hasError = projectQuery.isError || activityQuery.isError;

  return (
    <WorkspaceShell>
      {() => (
        <>
          {isLoading ? <ContentLoader /> : null}
          {hasError ? <ContentError onRetry={() => { void projectQuery.refetch(); void activityQuery.refetch(); }} /> : null}
          {projectQuery.data && activityQuery.data ? (
            <>
              <header>
                <Link className="text-sm font-semibold text-brand-600 hover:text-brand-700" to={`/projects/${projectId}`}>{projectQuery.data.name}</Link>
                <div className="mt-2 flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><Activity aria-hidden="true" size={20} /></span>
                  <div><h1 className="text-3xl font-bold tracking-tight text-slate-950">Project activity</h1><p className="mt-1 text-sm text-slate-600">A server-generated history of important project and task actions.</p></div>
                </div>
                <ProjectNavigation projectId={projectId} role={projectQuery.data.currentUserRole} />
              </header>
              <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="activity-heading">
                <h2 className="sr-only" id="activity-heading">Activity history</h2>
                <ActivityList activities={activityQuery.data} />
              </section>
            </>
          ) : null}
        </>
      )}
    </WorkspaceShell>
  );
};
