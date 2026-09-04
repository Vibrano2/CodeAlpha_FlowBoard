import { FolderKanban, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { ContentError, ContentLoader } from "../components/content-state";
import { ProjectCard } from "../components/project-card";
import { WorkspaceShell } from "../components/workspace-shell";
import { useProjects } from "../hooks/use-projects";

export const ProjectsPage = () => {
  const projectsQuery = useProjects();

  return (
    <WorkspaceShell>
      {() => (
        <>
          <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-brand-600">Projects</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">My projects</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">Projects you own and projects shared with you appear together.</p>
            </div>
            <Link className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600" to="/projects/new"><Plus aria-hidden="true" size={18} />Create project</Link>
          </header>

          <div className="mt-8">
            {projectsQuery.isPending ? <ContentLoader /> : null}
            {projectsQuery.isError ? <ContentError onRetry={() => void projectsQuery.refetch()} /> : null}
            {projectsQuery.isSuccess && projectsQuery.data.length === 0 ? (
              <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <FolderKanban className="mx-auto text-slate-400" aria-hidden="true" size={34} />
                <h2 className="mt-4 text-lg font-bold text-slate-950">No projects yet</h2>
                <p className="mt-2 text-sm text-slate-500">Create your first project to begin organizing work.</p>
              </section>
            ) : null}
            {projectsQuery.data?.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{projectsQuery.data.map((project) => <ProjectCard project={project} key={project.id} />)}</div> : null}
          </div>
        </>
      )}
    </WorkspaceShell>
  );
};
