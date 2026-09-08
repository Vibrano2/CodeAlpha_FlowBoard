import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { z } from "zod";
import { env } from "../config/env.js";
import { getUserById } from "../services/auth.service.js";
import { requireProjectMember } from "../services/project-access.service.js";
import { verifyAuthToken } from "../utils/auth-token.js";
import {
  type ProjectCommentEvent,
  type ProjectTaskEvent,
  subscribeToRealtimeEvents,
} from "./realtime-events.js";

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

interface SocketData {
  userId: string;
}

const projectPayloadSchema = z.object({ projectId: z.uuid() }).strict();
const projectRoom = (projectId: string) => `project:${projectId}`;
const userRoom = (userId: string) => `user:${userId}`;

const readCookie = (cookieHeader: string | undefined, name: string) => {
  if (!cookieHeader) return undefined;

  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    const key = part.slice(0, separator).trim();
    if (key !== name) continue;

    try {
      return decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      return undefined;
    }
  }

  return undefined;
};

const authenticationError = () => {
  const error = new Error("Authentication is required.") as Error & {
    data?: { code: string };
  };
  error.data = { code: "UNAUTHENTICATED" };
  return error;
};

export const createRealtimeServer = (httpServer: HttpServer) => {
  const io = new Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(httpServer, {
    cors: { origin: env.clientOrigins, credentials: true },
    serveClient: false,
    maxHttpBufferSize: 10_000,
    pingInterval: 25_000,
    pingTimeout: 20_000,
    allowRequest(request, callback) {
      const origin = request.headers.origin;
      callback(null, !origin || env.clientOrigins.includes(origin));
    },
  });

  io.use(async (socket, next) => {
    const token = readCookie(socket.handshake.headers.cookie, env.authCookieName);
    if (!token) {
      next(authenticationError());
      return;
    }

    try {
      const { sub } = verifyAuthToken(token);
      const user = await getUserById(sub);
      if (!user) throw new Error("Authenticated user was not found.");
      socket.data.userId = user.id;
      next();
    } catch {
      next(authenticationError());
    }
  });

  io.on("connection", (socket) => {
    void socket.join(userRoom(socket.data.userId));

    socket.on("project:join", async (payload, acknowledge) => {
      const result = projectPayloadSchema.safeParse(payload);
      if (!result.success) {
        if (typeof acknowledge === "function") acknowledge({ ok: false, error: "INVALID_PROJECT" });
        return;
      }

      try {
        await requireProjectMember(result.data.projectId, socket.data.userId);
        await socket.join(projectRoom(result.data.projectId));
        if (typeof acknowledge === "function") acknowledge({ ok: true });
      } catch {
        if (typeof acknowledge === "function") acknowledge({ ok: false, error: "PROJECT_ACCESS_DENIED" });
      }
    });

    socket.on("project:leave", (payload) => {
      const result = projectPayloadSchema.safeParse(payload);
      if (result.success) void socket.leave(projectRoom(result.data.projectId));
    });
  });

  const unsubscribe = subscribeToRealtimeEvents((event) => {
    switch (event.type) {
      case "task:created":
      case "task:updated":
      case "task:deleted":
      case "comment:created":
      case "comment:updated":
      case "comment:deleted":
        io.to(projectRoom(event.projectId)).emit(event.type, event);
        break;
      case "notification:changed":
        for (const userId of new Set(event.userIds)) {
          io.to(userRoom(userId)).emit("notification:changed");
        }
        break;
      case "project:members-changed":
        io.to(projectRoom(event.projectId)).emit("project:members-changed", {
          projectId: event.projectId,
        });
        break;
      case "project:access-revoked":
        io.in(userRoom(event.userId)).socketsLeave(projectRoom(event.projectId));
        io.to(userRoom(event.userId)).emit("project:access-revoked", {
          projectId: event.projectId,
        });
        break;
    }
  });

  return {
    io,
    close: (callback?: () => void) => {
      unsubscribe();
      io.close(callback);
    },
  };
};
