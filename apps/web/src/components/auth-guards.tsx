import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useCurrentUser } from "../hooks/use-auth";
import { PageLoader } from "./page-loader";
import { SessionError } from "./session-error";

export const ProtectedRoute = () => {
  const location = useLocation();
  const session = useCurrentUser();

  if (session.isPending) return <PageLoader />;
  if (session.isError) return <SessionError onRetry={() => void session.refetch()} />;

  return session.data ? (
    <Outlet />
  ) : (
    <Navigate replace to="/login" state={{ from: location.pathname }} />
  );
};

export const PublicOnlyRoute = () => {
  const session = useCurrentUser();

  if (session.isPending) return <PageLoader />;
  if (session.isError) return <SessionError onRetry={() => void session.refetch()} />;

  return session.data ? <Navigate replace to="/dashboard" /> : <Outlet />;
};
