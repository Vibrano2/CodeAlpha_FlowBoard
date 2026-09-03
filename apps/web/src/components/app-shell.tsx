import type { LucideIcon } from "lucide-react";
import {
  Bell,
  CheckSquare2,
  FolderKanban,
  LayoutDashboard,
  Settings,
} from "lucide-react";
import type { ReactNode } from "react";
import { Brand } from "./brand";

interface NavigationItem {
  icon: LucideIcon;
  label: string;
  active?: boolean;
}

const navigation: NavigationItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "My Tasks", icon: CheckSquare2 },
  { label: "Projects", icon: FolderKanban },
  { label: "Notifications", icon: Bell },
];

interface AppShellProps {
  children: ReactNode;
}

export const AppShell = ({ children }: AppShellProps) => (
  <div className="min-h-screen bg-slate-50 text-slate-950">
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-68 border-r border-slate-200 bg-white px-5 py-6 lg:flex lg:flex-col">
      <div className="px-2">
        <Brand />
      </div>

      <nav className="mt-10" aria-label="Primary navigation">
        <ul className="space-y-1.5">
          {navigation.map(({ active, icon: Icon, label }) => (
            <li key={label}>
              <button
                className={[
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "cursor-default text-slate-500",
                ].join(" ")}
                type="button"
                aria-current={active ? "page" : undefined}
                disabled={!active}
              >
                <Icon aria-hidden="true" size={19} />
                <span>{label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto border-t border-slate-200 pt-5">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
          <span className="grid size-9 place-items-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
            FB
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800">Your workspace</p>
            <p className="text-xs text-slate-500">Account setup next</p>
          </div>
          <Settings aria-hidden="true" className="text-slate-400" size={18} />
        </div>
      </div>
    </aside>

    <div className="lg:pl-68">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur lg:hidden">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <Brand />
          <span className="grid size-9 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
            FB
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-10 lg:py-10">
        {children}
      </main>
    </div>
  </div>
);
