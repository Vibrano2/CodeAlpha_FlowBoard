import { NavLink } from "react-router-dom";
import type { ProjectRole } from "../types/project";

const futureItems = ["Board", "Members", "Activity"];

export const ProjectNavigation = ({ projectId, role }: { projectId: string; role: ProjectRole }) => (
  <nav className="mt-7 overflow-x-auto border-b border-slate-200" aria-label="Project navigation">
    <ul className="flex min-w-max items-center gap-6">
      <li><NavLink className={({ isActive }) => `block border-b-2 px-1 pb-3 text-sm font-semibold ${isActive ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-800"}`} end to={`/projects/${projectId}`}>Overview</NavLink></li>
      {futureItems.map((item) => <li key={item}><span className="block border-b-2 border-transparent px-1 pb-3 text-sm font-semibold text-slate-400" aria-disabled="true">{item}</span></li>)}
      {role === "OWNER" ? <li><NavLink className={({ isActive }) => `block border-b-2 px-1 pb-3 text-sm font-semibold ${isActive ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-800"}`} to={`/projects/${projectId}/settings`}>Settings</NavLink></li> : null}
    </ul>
  </nav>
);
