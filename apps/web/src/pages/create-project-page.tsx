import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ProjectForm } from "../components/project-form";
import { useToast } from "../components/toast";
import { WorkspaceShell } from "../components/workspace-shell";
import { useCreateProject } from "../hooks/use-projects";

export const CreateProjectPage = () => {
  const navigate = useNavigate();
  const createProject = useCreateProject();
  const { showToast } = useToast();

  return (
    <WorkspaceShell>
      {() => (
        <div className="mx-auto max-w-2xl">
          <Link className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-brand-700" to="/projects"><ArrowLeft aria-hidden="true" size={17} />Back to projects</Link>
          <header className="mt-6">
            <p className="text-sm font-semibold text-brand-600">New project</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Create a project</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">You will become the owner. FlowBoard will also create the main board automatically.</p>
          </header>
          <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <ProjectForm
              submitLabel="Create project"
              pendingLabel="Creating project..."
              isPending={createProject.isPending}
              errorMessage={createProject.isError ? createProject.error.message : undefined}
              onCancel={() => navigate("/projects")}
              onSubmit={(input) => createProject.mutate(input, {
                onSuccess: (project) => {
                  showToast({ title: "Project created" });
                  navigate(`/projects/${project.id}`, { replace: true });
                },
              })}
            />
          </section>
        </div>
      )}
    </WorkspaceShell>
  );
};
