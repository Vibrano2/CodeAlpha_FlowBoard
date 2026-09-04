import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute, PublicOnlyRoute } from "./components/auth-guards";
import { DashboardPage } from "./pages/dashboard-page";
import { CreateProjectPage } from "./pages/create-project-page";
import { LoginPage } from "./pages/login-page";
import { ProjectOverviewPage } from "./pages/project-overview-page";
import { ProjectMembersPage } from "./pages/project-members-page";
import { ProjectSettingsPage } from "./pages/project-settings-page";
import { ProjectBoardPage } from "./pages/project-board-page";
import { ProjectsPage } from "./pages/projects-page";
import { RegisterPage } from "./pages/register-page";
import { TaskDetailPage } from "./pages/task-detail-page";
import { MyTasksPage } from "./pages/my-tasks-page";
import { ProjectActivityPage } from "./pages/project-activity-page";
import { NotificationsPage } from "./pages/notifications-page";

export const App = () => (
  <Routes>
    <Route element={<PublicOnlyRoute />}>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
    </Route>
    <Route element={<ProtectedRoute />}>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/tasks" element={<MyTasksPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/projects/new" element={<CreateProjectPage />} />
      <Route path="/projects/:projectId" element={<ProjectOverviewPage />} />
      <Route path="/projects/:projectId/board" element={<ProjectBoardPage />} />
      <Route path="/projects/:projectId/members" element={<ProjectMembersPage />} />
      <Route path="/projects/:projectId/activity" element={<ProjectActivityPage />} />
      <Route path="/projects/:projectId/settings" element={<ProjectSettingsPage />} />
      <Route path="/tasks/:taskId" element={<TaskDetailPage />} />
    </Route>
    <Route path="/" element={<Navigate replace to="/dashboard" />} />
    <Route path="*" element={<Navigate replace to="/dashboard" />} />
  </Routes>
);
