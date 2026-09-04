import type { LucideIcon } from "lucide-react";
import {
  Bell,
  CheckSquare2,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Settings,
} from "lucide-react";
import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import type { User } from "../types/auth";
import { useNotifications } from "../hooks/use-notifications";
import { Brand } from "./brand";

interface NavigationItem {
  icon: LucideIcon;
  label: string;
  path?: string;
}

const navigation: NavigationItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "My Tasks", icon: CheckSquare2, path: "/tasks" },
  { label: "Projects", icon: FolderKanban, path: "/projects" },
  { label: "Notifications", icon: Bell, path: "/notifications" },
];

interface AppShellProps {
  children: ReactNode;
  user: User;
  onLogout: () => void;
  isLoggingOut: boolean;
}

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

export const AppShell = ({ children, user, onLogout, isLoggingOut }: AppShellProps) => {
  const notificationsQuery = useNotifications();
  const unreadCount = notificationsQuery.data?.unreadCount ?? 0;
  const unreadLabel = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-68 border-r border-slate-200 bg-white px-5 py-6 lg:flex lg:flex-col">
      <div className="px-2">
        <Brand />
      </div>

      <nav className="mt-10" aria-label="Primary navigation">
        <ul className="space-y-1.5">
          {navigation.map(({ icon: Icon, label, path }) => (
            <li key={label}>
              {path ? (
                <NavLink className={({ isActive }) => ["flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600", isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50"].join(" ")} to={path}>
                  <Icon aria-hidden="true" size={19} /><span>{label}</span>
                  {label === "Notifications" && unreadCount > 0 ? (
                    <span className="ml-auto rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold text-white" aria-label={`${unreadCount} unread notifications`}>{unreadLabel}</span>
                  ) : null}
                </NavLink>
              ) : (
                <span className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-400" aria-disabled="true">
                  <Icon aria-hidden="true" size={19} /><span>{label}</span>
                </span>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto border-t border-slate-200 pt-5">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
          <span className="grid size-9 place-items-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
            {getInitials(user.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>
          <Settings aria-hidden="true" className="text-slate-400" size={18} />
        </div>
        <button className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-60" type="button" onClick={onLogout} disabled={isLoggingOut}>
          <LogOut aria-hidden="true" size={18} />
          {isLoggingOut ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </aside>

    <div className="lg:pl-68">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur lg:hidden">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <Brand />
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
              {getInitials(user.name)}
            </span>
            <button className="grid size-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-60" type="button" onClick={onLogout} disabled={isLoggingOut} aria-label="Sign out">
              <LogOut aria-hidden="true" size={18} />
            </button>
          </div>
        </div>
        <nav className="border-t border-slate-100 px-4 sm:px-6" aria-label="Mobile navigation">
          <ul className="flex gap-4 overflow-x-auto">
            {navigation.filter((item) => item.path).map(({ label, path }) => (
              <li key={label}>
                <NavLink className={({ isActive }) => `flex items-center gap-1.5 whitespace-nowrap border-b-2 py-2.5 text-xs font-semibold ${isActive ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500"}`} to={path!}>
                  {label}
                  {label === "Notifications" && unreadCount > 0 ? (
                    <span className="rounded-full bg-brand-600 px-1.5 py-0.5 text-[9px] font-bold text-white" aria-label={`${unreadCount} unread notifications`}>{unreadLabel}</span>
                  ) : null}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-10 lg:py-10">
        {children}
      </main>
    </div>
    </div>
  );
};
