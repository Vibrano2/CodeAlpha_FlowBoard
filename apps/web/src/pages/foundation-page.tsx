import { ArrowRight, Check, FolderKanban, UsersRound } from "lucide-react";
import { AppShell } from "../components/app-shell";
import { HealthCard } from "../components/health-card";

const foundationItems = [
  "Responsive application shell",
  "Typed frontend and REST API",
  "PostgreSQL and Prisma connection",
  "Safe environment validation",
];

export const FoundationPage = () => (
  <AppShell>
    <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-brand-600">Workspace</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          Welcome to FlowBoard
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
          A focused place for small teams to organize projects, assign work, and keep task
          conversations together.
        </p>
      </div>
      <span className="w-fit rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
        Foundation ready
      </span>
    </header>

    <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.75fr)]">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6 sm:p-8">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-sm shadow-brand-600/20">
            <FolderKanban aria-hidden="true" size={24} />
          </div>
          <h2 className="mt-6 max-w-xl text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Turn team plans into visible progress.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            The project foundation is in place. Authentication is the next milestone before
            project and task workflows are introduced.
          </p>
        </div>

        <div className="grid gap-6 p-6 sm:grid-cols-2 sm:p-8">
          <div>
            <p className="text-sm font-bold text-slate-900">Foundation includes</p>
            <ul className="mt-4 space-y-3">
              {foundationItems.map((item) => (
                <li className="flex items-start gap-2.5 text-sm text-slate-600" key={item}>
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700">
                    <Check aria-hidden="true" size={13} strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
            <UsersRound aria-hidden="true" className="text-slate-500" size={23} />
            <p className="mt-4 text-sm font-bold text-slate-900">No projects yet</p>
            <p className="mt-1.5 text-sm leading-6 text-slate-500">
              Your real project data will appear here after project management is enabled.
            </p>
            <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-brand-600">
              No fabricated demo metrics
              <ArrowRight aria-hidden="true" size={16} />
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-6">
        <HealthCard />

        <section className="rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
          <p className="text-xs font-semibold tracking-widest text-indigo-300 uppercase">
            Built for clarity
          </p>
          <h2 className="mt-3 text-xl font-bold">Small teams, less noise.</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            FlowBoard keeps ownership, task status, and communication visible without adding
            unnecessary process.
          </p>
        </section>
      </div>
    </div>
  </AppShell>
);
