import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "../components/toast";
import { projectActivityQueryPrefix, commentsQueryKey } from "../lib/collaboration";
import { membersQueryKey } from "../lib/members";
import { notificationsQueryKey } from "../lib/notifications";
import { projectQueryKey, projectsQueryKey } from "../lib/projects";
import {
  getRealtimeSocket,
  type ProjectCommentEvent,
  type ProjectTaskEvent,
  realtimeIsEnabled,
} from "../lib/realtime";
import { assignedTasksQueryKey, taskQueryKey, tasksQueryPrefix } from "../lib/tasks";
import { authQueryKey } from "../lib/auth";

interface ConnectionError extends Error {
  data?: { code?: string };
}

export const useRealtimeSession = (userId: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!realtimeIsEnabled || !userId) return;
    const socket = getRealtimeSocket();
    const handleNotifications = () => {
      void queryClient.invalidateQueries({ queryKey: notificationsQueryKey, exact: true });
    };
    const handleConnectionError = (error: ConnectionError) => {
      if (error.data?.code !== "UNAUTHENTICATED") return;
      queryClient.setQueryData(authQueryKey, null);
      queryClient.removeQueries({ predicate: ({ queryKey }) => queryKey[0] !== "auth" });
    };

    socket.on("notification:changed", handleNotifications);
    socket.on("connect_error", handleConnectionError);
    if (!socket.connected) socket.connect();

    return () => {
      socket.off("notification:changed", handleNotifications);
      socket.off("connect_error", handleConnectionError);
      socket.disconnect();
    };
  }, [queryClient, userId]);
};

export const useProjectRealtime = (projectId: string) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  useEffect(() => {
    if (!realtimeIsEnabled || !projectId) return;
    const socket = getRealtimeSocket();

    const leaveProject = (message: string) => {
      queryClient.removeQueries({ queryKey: ["projects", projectId] });
      void queryClient.invalidateQueries({ queryKey: projectsQueryKey, exact: true });
      void queryClient.invalidateQueries({ queryKey: assignedTasksQueryKey, exact: true });
      showToast({ title: "Project access changed", message, tone: "info" });
      navigate("/projects", { replace: true });
    };

    const joinProject = () => {
      socket.emit("project:join", { projectId }, (response) => {
        if (!response.ok) leaveProject("You no longer have access to this project.");
      });
    };

    const refreshTasks = (event: ProjectTaskEvent) => {
      if (event.projectId !== projectId) return;
      void queryClient.invalidateQueries({ queryKey: tasksQueryPrefix(projectId) });
      void queryClient.invalidateQueries({ queryKey: assignedTasksQueryKey, exact: true });
      void queryClient.invalidateQueries({ queryKey: taskQueryKey(event.taskId), exact: true });
      void queryClient.invalidateQueries({ queryKey: projectActivityQueryPrefix(projectId) });
    };
    const handleTaskDeleted = (event: ProjectTaskEvent) => {
      if (event.projectId !== projectId) return;
      queryClient.removeQueries({ queryKey: taskQueryKey(event.taskId), exact: true });
      refreshTasks(event);
      if (location.pathname === `/tasks/${event.taskId}`) {
        showToast({ title: "Task deleted", message: "Another project member deleted this task.", tone: "info" });
        navigate(`/projects/${projectId}/board`, { replace: true });
      }
    };
    const refreshComments = (event: ProjectCommentEvent) => {
      if (event.projectId !== projectId) return;
      void queryClient.invalidateQueries({ queryKey: commentsQueryKey(event.taskId), exact: true });
      void queryClient.invalidateQueries({ queryKey: taskQueryKey(event.taskId), exact: true });
      void queryClient.invalidateQueries({ queryKey: tasksQueryPrefix(projectId) });
      void queryClient.invalidateQueries({ queryKey: projectActivityQueryPrefix(projectId) });
    };
    const refreshMembers = (event: { projectId: string }) => {
      if (event.projectId !== projectId) return;
      void queryClient.invalidateQueries({ queryKey: membersQueryKey(projectId), exact: true });
      void queryClient.invalidateQueries({ queryKey: projectQueryKey(projectId), exact: true });
      void queryClient.invalidateQueries({ queryKey: projectsQueryKey, exact: true });
      void queryClient.invalidateQueries({ queryKey: projectActivityQueryPrefix(projectId) });
    };
    const handleAccessRevoked = (event: { projectId: string }) => {
      if (event.projectId === projectId) {
        leaveProject("The project owner removed your membership.");
      }
    };

    socket.on("connect", joinProject);
    socket.on("task:created", refreshTasks);
    socket.on("task:updated", refreshTasks);
    socket.on("task:deleted", handleTaskDeleted);
    socket.on("comment:created", refreshComments);
    socket.on("comment:updated", refreshComments);
    socket.on("comment:deleted", refreshComments);
    socket.on("project:members-changed", refreshMembers);
    socket.on("project:access-revoked", handleAccessRevoked);
    if (socket.connected) joinProject();

    return () => {
      socket.off("connect", joinProject);
      socket.off("task:created", refreshTasks);
      socket.off("task:updated", refreshTasks);
      socket.off("task:deleted", handleTaskDeleted);
      socket.off("comment:created", refreshComments);
      socket.off("comment:updated", refreshComments);
      socket.off("comment:deleted", refreshComments);
      socket.off("project:members-changed", refreshMembers);
      socket.off("project:access-revoked", handleAccessRevoked);
      if (socket.connected) socket.emit("project:leave", { projectId });
    };
  }, [location.pathname, navigate, projectId, queryClient, showToast]);
};
