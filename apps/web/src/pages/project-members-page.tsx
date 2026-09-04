import { Search, Trash2, UserPlus, UsersRound } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ContentError, ContentLoader } from "../components/content-state";
import { ProjectNavigation } from "../components/project-navigation";
import { useToast } from "../components/toast";
import { WorkspaceShell } from "../components/workspace-shell";
import {
  useAddProjectMember,
  useProjectMembers,
  useRemoveProjectMember,
  useUserSearch,
} from "../hooks/use-members";
import { useProject } from "../hooks/use-projects";
import type { ProjectMember, UserSearchResult } from "../types/project";

export const ProjectMembersPage = () => {
  const { projectId = "" } = useParams();
  const projectQuery = useProject(projectId);
  const membersQuery = useProjectMembers(projectId);
  const [email, setEmail] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const searchQuery = useUserSearch(searchTerm);
  const addMember = useAddProjectMember();
  const removeMember = useRemoveProjectMember();
  const { showToast } = useToast();

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextSearchTerm = email.trim().toLowerCase();
    if (nextSearchTerm === searchTerm) {
      void searchQuery.refetch();
      return;
    }
    setSearchTerm(nextSearchTerm);
  };

  const handleRemove = (member: ProjectMember) => {
    const confirmed = window.confirm(`Remove ${member.user.name} from this project? They will immediately lose access.`);
    if (confirmed) {
      removeMember.mutate({ projectId, userId: member.userId }, {
        onSuccess: () => showToast(`${member.user.name} was removed from the project.`),
      });
    }
  };

  const isLoading = projectQuery.isPending || membersQuery.isPending;
  const hasError = projectQuery.isError || membersQuery.isError;

  return (
    <WorkspaceShell>
      {() => (
        <>
          {isLoading ? <ContentLoader /> : null}
          {hasError ? <ContentError onRetry={() => { void projectQuery.refetch(); void membersQuery.refetch(); }} /> : null}
          {projectQuery.data && membersQuery.data ? (
            <>
              <header>
                <Link className="text-sm font-semibold text-brand-600 hover:text-brand-700" to={`/projects/${projectId}`}>{projectQuery.data.name}</Link>
                <div className="mt-2 flex items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight text-slate-950">Project members</h1>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{membersQuery.data.length}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">View everyone with access to this project.</p>
                <ProjectNavigation projectId={projectId} role={projectQuery.data.currentUserRole} />
              </header>

              <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
                    <h2 className="font-bold text-slate-950">Members</h2>
                  </div>
                  <ul className="divide-y divide-slate-100">
                    {membersQuery.data.map((member) => (
                      <li className="flex items-center gap-4 px-5 py-4 sm:px-6" key={member.id}>
                        <Avatar name={member.user.name} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-bold text-slate-900">{member.user.name}</p>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${member.role === "OWNER" ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-slate-600"}`}>{member.role === "OWNER" ? "Owner" : "Member"}</span>
                          </div>
                          <p className="mt-0.5 truncate text-sm text-slate-500">{member.user.email}</p>
                        </div>
                        {projectQuery.data.currentUserRole === "OWNER" && member.role !== "OWNER" ? (
                          <button className="grid size-9 shrink-0 place-items-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50" type="button" aria-label={`Remove ${member.user.name}`} onClick={() => handleRemove(member)} disabled={removeMember.isPending}><Trash2 aria-hidden="true" size={17} /></button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                  {removeMember.isError ? <p className="border-t border-red-100 bg-red-50 px-6 py-3 text-sm text-red-700" role="alert">{removeMember.error.message}</p> : null}
                </section>

                {projectQuery.data.currentUserRole === "OWNER" ? (
                  <section className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><UserPlus aria-hidden="true" size={20} /></span>
                    <h2 className="mt-4 font-bold text-slate-950">Add a member</h2>
                    <p className="mt-1.5 text-sm leading-6 text-slate-500">Search registered FlowBoard users by email.</p>
                    <form className="mt-5 flex gap-2" onSubmit={handleSearch}>
                      <label className="sr-only" htmlFor="member-email">User email</label>
                      <input className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100" id="member-email" type="search" placeholder="name@example.com" value={email} onChange={(event) => setEmail(event.target.value)} minLength={3} required />
                      <button className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-600 text-white hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-50" type="submit" aria-label="Search users" disabled={email.trim().length < 3}><Search aria-hidden="true" size={18} /></button>
                    </form>

                    <SearchResults
                      users={searchQuery.data}
                      existingUserIds={new Set(membersQuery.data.map((member) => member.userId))}
                      isLoading={searchQuery.isFetching}
                      hasSearched={Boolean(searchTerm)}
                      errorMessage={searchQuery.isError ? searchQuery.error.message : undefined}
                      addError={addMember.isError ? addMember.error.message : undefined}
                      pendingUserId={addMember.isPending ? addMember.variables?.userId : undefined}
                      onAdd={(userId) => {
                        const addedUser = searchQuery.data?.find((user) => user.id === userId);
                        addMember.mutate({ projectId, userId }, {
                          onSuccess: () => showToast(`${addedUser?.name ?? "Member"} was added to the project.`),
                        });
                      }}
                    />
                  </section>
                ) : (
                  <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <UsersRound className="text-slate-400" aria-hidden="true" size={24} />
                    <h2 className="mt-4 font-bold text-slate-950">Member access</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">Only the project owner can add or remove members.</p>
                  </aside>
                )}
              </div>
            </>
          ) : null}
        </>
      )}
    </WorkspaceShell>
  );
};

const Avatar = ({ name }: { name: string }) => (
  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600" aria-hidden="true">
    {name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}
  </span>
);

interface SearchResultsProps {
  users?: UserSearchResult[];
  existingUserIds: Set<string>;
  isLoading: boolean;
  hasSearched: boolean;
  errorMessage?: string;
  addError?: string;
  pendingUserId?: string;
  onAdd: (userId: string) => void;
}

const SearchResults = ({ users, existingUserIds, isLoading, hasSearched, errorMessage, addError, pendingUserId, onAdd }: SearchResultsProps) => {
  if (isLoading) return <p className="mt-4 text-sm text-slate-500" role="status">Searching users...</p>;
  if (errorMessage) return <p className="mt-4 text-sm text-red-700" role="alert">{errorMessage}</p>;
  if (hasSearched && users?.length === 0) return <p className="mt-4 text-sm text-slate-500">No registered users found.</p>;
  if (!users?.length) return null;

  return (
    <div className="mt-4 space-y-3">
      {users.map((user) => {
        const alreadyMember = existingUserIds.has(user.id);
        return (
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3" key={user.id}>
            <Avatar name={user.name} />
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{user.name}</p><p className="truncate text-xs text-slate-500">{user.email}</p></div>
            <button className="rounded-lg border border-brand-200 px-2.5 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50 disabled:border-slate-200 disabled:text-slate-400" type="button" onClick={() => onAdd(user.id)} disabled={alreadyMember || Boolean(pendingUserId)}>{alreadyMember ? "Added" : pendingUserId === user.id ? "Adding..." : "Add"}</button>
          </div>
        );
      })}
      {addError ? <p className="text-sm text-red-700" role="alert">{addError}</p> : null}
    </div>
  );
};
