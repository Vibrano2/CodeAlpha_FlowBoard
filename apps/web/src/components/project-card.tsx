import { ArrowUpRight, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import type { Project } from "../types/project";

export const ProjectCard = ({ project }: { project: Project }) => (
  <article className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md">
    <div className="flex items-start justify-between gap-4">
      <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
        {project.currentUserRole === "OWNER" ? "Owner" : "Member"}
      </span>
      <Link className="grid size-9 place-items-center rounded-xl text-slate-400 transition group-hover:bg-brand-50 group-hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600" to={`/projects/${project.id}`} aria-label={`Open ${project.name}`}>
        <ArrowUpRight aria-hidden="true" size={18} />
      </Link>
    </div>
    <Link className="mt-4 block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600" to={`/projects/${project.id}`}>
      <h3 className="text-lg font-bold text-slate-950">{project.name}</h3>
      <p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-slate-500">
        {project.description || "No description added yet."}
      </p>
    </Link>
    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
      <span className="flex items-center gap-1.5"><UsersRound aria-hidden="true" size={15} />{project._count.members} {project._count.members === 1 ? "member" : "members"}</span>
      <span>Updated {new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(project.updatedAt))}</span>
    </div>
  </article>
);
