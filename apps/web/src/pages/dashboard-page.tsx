import { CalendarClock, CheckSquare2, FolderKanban, Plus, UsersRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/app-shell";
import { HealthCard } from "../components/health-card";
import { useCurrentUser, useLogout } from "../hooks/use-auth";

const dashboardSections = [
  { title: "Projects I own", description: "Projects you create will appear here.", icon: FolderKanban },
  { title: "Shared with me", description: "Projects teammates share with you will appear here.", icon: UsersRound },
  { title: "Tasks assigned to me", description: "Your assigned tasks will appear here.", icon: CheckSquare2 },
  { title: "Upcoming due dates", description: "Upcoming and overdue work will appear here.", icon: CalendarClock },
];

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const logout = useLogout();

  if (!user) return null;

  const handleLogout = () => {
    logout.mutate(undefined, { onSettled: () => navigate("/login", { replace: true }) });
  };

  return (
    <AppShell user={user} onLogout={handleLogout} isLoggingOut={logout.isPending}>
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-600">Dashboard</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Welcome, {user.name.split(" ")[0]}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">Your projects, assigned work, and upcoming deadlines will stay organized here.</p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-60" type="button" disabled title="Available in Milestone 3">
          <Plus aria-hidden="true" size={18} /> Create project
        </button>
      </header>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardSections.map(({ title, description, icon: Icon }) => (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={title}>
            <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon aria-hidden="true" size={20} /></span>
            <h2 className="mt-4 text-sm font-bold text-slate-900">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
          </section>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.65fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-9">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-500"><FolderKanban aria-hidden="true" size={24} /></span>
          <h2 className="mt-5 text-lg font-bold text-slate-950">No projects yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Create your first project when project management becomes available in Milestone 3.</p>
        </section>
        <HealthCard />
      </div>
    </AppShell>
  );
};
