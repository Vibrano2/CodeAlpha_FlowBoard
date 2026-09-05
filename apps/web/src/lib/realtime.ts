import { io, type Socket } from "socket.io-client";

export interface ProjectTaskEvent {
  projectId: string;
  taskId: string;
}

export interface ProjectCommentEvent extends ProjectTaskEvent {
  commentId: string;
}

interface ServerToClientEvents {
  "task:created": (event: ProjectTaskEvent) => void;
  "task:updated": (event: ProjectTaskEvent) => void;
  "task:deleted": (event: ProjectTaskEvent) => void;
  "comment:created": (event: ProjectCommentEvent) => void;
  "comment:updated": (event: ProjectCommentEvent) => void;
  "comment:deleted": (event: ProjectCommentEvent) => void;
  "notification:changed": () => void;
  "project:members-changed": (event: { projectId: string }) => void;
  "project:access-revoked": (event: { projectId: string }) => void;
}

interface JoinResponse {
  ok: boolean;
  error?: "INVALID_PROJECT" | "PROJECT_ACCESS_DENIED";
}

interface ClientToServerEvents {
  "project:join": (
    payload: { projectId: string },
    acknowledge: (response: JoinResponse) => void,
  ) => void;
  "project:leave": (payload: { projectId: string }) => void;
}

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";
const socketUrl = import.meta.env.VITE_SOCKET_URL
  ?? new URL(apiUrl, window.location.origin).origin;

let realtimeSocket: Socket<ServerToClientEvents, ClientToServerEvents> | undefined;

export const getRealtimeSocket = () => {
  realtimeSocket ??= io(socketUrl, {
    autoConnect: false,
    withCredentials: true,
    transports: ["websocket", "polling"],
  });
  return realtimeSocket;
};

export const realtimeIsEnabled = import.meta.env.MODE !== "test";
