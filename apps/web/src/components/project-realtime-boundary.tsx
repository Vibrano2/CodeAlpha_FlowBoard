import { Outlet, useParams } from "react-router-dom";
import { useProjectRealtime } from "../hooks/use-realtime";

export const ProjectRealtimeBoundary = () => {
  const { projectId = "" } = useParams();
  useProjectRealtime(projectId);
  return <Outlet />;
};
