import { ArrowLeft, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ContentError, ContentLoader } from "../components/content-state";
import { ConfirmDialog } from "../components/confirm-dialog";
import { ProjectForm } from "../components/project-form";
import { ProjectNavigation } from "../components/project-navigation";
import { WorkspaceShell } from "../components/workspace-shell";
import { useToast } from "../components/toast";
import { useDeleteProject, useProject, useUpdateProject } from "../hooks/use-projects";

export const ProjectSettingsPage = () => {
  const { projectId = "" } = useParams();
  const navigate = useNavigate();
  const projectQuery = useProject(projectId);
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const { showToast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDelete = () => {
    if (!projectQuery.data) return;
    deleteProject.mutate(projectId, {
      onSuccess: () => {
        showToast({ title: "Project deleted" });
        navigate("/projects", { replace: true });
      },
    });
  };

  return (
    <WorkspaceShell>
      {() => (
        <>
          {projectQuery.isPending ? <ContentLoader /> : null}
          {projectQuery.isError ? <ContentError onRetry={() => void projectQuery.refetch()} /> : null}
          {projectQuery.data ? (
            <>
              <header>
                <button className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700" type="button" onClick={() => navigate(`/projects/${projectId}`)}><ArrowLeft aria-hidden="true" size={17} />Project overview</button>
                <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Project settings</h1>
                <ProjectNavigation projectId={projectId} role={projectQuery.data.currentUserRole} />
              </header>

              {projectQuery.data.currentUserRole !== "OWNER" ? (
                <section className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">Only the project owner can change project settings.</section>
              ) : (
                <div className="mt-7 space-y-6">
                  <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <h2 className="text-lg font-bold text-slate-950">General settings</h2>
                    <p className="mt-1 text-sm text-slate-500">Update the project name or description.</p>
                    <div className="mt-6">
                      <ProjectForm
                        key={projectQuery.data.updatedAt}
                        initialValue={{ name: projectQuery.data.name, description: projectQuery.data.description }}
                        submitLabel="Save changes"
                        pendingLabel="Saving changes..."
                        isPending={updateProject.isPending}
                        errorMessage={updateProject.isError ? updateProject.error.message : undefined}
                        onCancel={() => navigate(`/projects/${projectId}`)}
                        onSubmit={(input) => updateProject.mutate(
                          { projectId, input },
                          { onSuccess: () => showToast({ title: "Project settings saved" }) },
                        )}
                      />
                    </div>
                  </section>

                  <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm sm:p-8">
                    <h2 className="text-lg font-bold text-red-700">Delete project</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">Permanently delete this project, its board, memberships, and activity records. This action cannot be undone.</p>
                    {deleteProject.isError ? <p className="mt-3 text-sm text-red-700" role="alert">{deleteProject.error.message}</p> : null}
                    <button className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-60" type="button" onClick={() => { deleteProject.reset(); setDeleteDialogOpen(true); }} disabled={deleteProject.isPending}><Trash2 aria-hidden="true" size={17} />Delete project</button>
                  </section>
                  <ConfirmDialog
                    open={deleteDialogOpen}
                    title="Delete project permanently?"
                    description={`Delete “${projectQuery.data.name}”, its board, tasks, comments, members, and activity. This action cannot be undone.`}
                    confirmLabel="Delete project"
                    pendingLabel="Deleting project..."
                    isPending={deleteProject.isPending}
                    errorMessage={deleteProject.isError ? deleteProject.error.message : undefined}
                    onCancel={() => setDeleteDialogOpen(false)}
                    onConfirm={handleDelete}
                  />
                </div>
              )}
            </>
          ) : null}
        </>
      )}
    </WorkspaceShell>
  );
};
