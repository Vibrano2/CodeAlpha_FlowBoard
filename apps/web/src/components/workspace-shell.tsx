import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useCurrentUser, useLogout } from "../hooks/use-auth";
import type { User } from "../types/auth";
import { AppShell } from "./app-shell";

interface WorkspaceShellProps {
  children: (user: User) => ReactNode;
}

export const WorkspaceShell = ({ children }: WorkspaceShellProps) => {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const logout = useLogout();

  if (!user) return null;

  const handleLogout = () => {
    logout.mutate(undefined, { onSettled: () => navigate("/login", { replace: true }) });
  };

  return (
    <AppShell user={user} onLogout={handleLogout} isLoggingOut={logout.isPending}>
      {children(user)}
    </AppShell>
  );
};
