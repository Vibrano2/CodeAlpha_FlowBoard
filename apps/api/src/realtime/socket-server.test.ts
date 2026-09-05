import { createServer, type Server as HttpServer } from "node:http";
import jwt from "jsonwebtoken";
import { io as createClient, type Socket as ClientSocket } from "socket.io-client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const userId = "708fe7a5-4696-43b4-bdf1-4ef5e19f845a";
const projectId = "f9534ad1-f82a-414f-ae76-b2655d881f6d";
const taskId = "d56d146a-d851-49d4-b205-6397d4a3a789";

const databaseMocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  membershipFindUnique: vi.fn(),
}));

vi.mock("../database/prisma.js", () => ({
  prisma: {
    user: { findUnique: databaseMocks.userFindUnique },
    projectMember: { findUnique: databaseMocks.membershipFindUnique },
  },
}));

import { publishRealtimeEvent } from "./realtime-events.js";
import { createRealtimeServer } from "./socket-server.js";

const safeUser = {
  id: userId,
  name: "Victor Ibrahim",
  email: "victor@example.com",
  avatarUrl: null,
  createdAt: new Date("2026-09-04T06:00:00.000Z"),
  updatedAt: new Date("2026-09-04T06:00:00.000Z"),
};

const authCookie = () => {
  const token = jwt.sign({}, process.env.JWT_SECRET!, {
    audience: "flowboard-web",
    issuer: "flowboard-api",
    subject: userId,
    expiresIn: "1h",
  });
  return `flowboard_session=${token}`;
};

describe("Socket.io authorization", () => {
  let httpServer: HttpServer;
  let realtimeServer: ReturnType<typeof createRealtimeServer>;
  let serverUrl: string;
  const clients: ClientSocket[] = [];

  beforeEach(async () => {
    databaseMocks.userFindUnique.mockReset();
    databaseMocks.membershipFindUnique.mockReset();
    databaseMocks.userFindUnique.mockResolvedValue(safeUser);
    databaseMocks.membershipFindUnique.mockResolvedValue({
      role: "MEMBER",
      project: { id: projectId, name: "Website launch", ownerId: "owner-id" },
    });

    httpServer = createServer();
    realtimeServer = createRealtimeServer(httpServer);
    await new Promise<void>((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
    const address = httpServer.address();
    if (!address || typeof address === "string") throw new Error("Test server address unavailable.");
    serverUrl = `http://127.0.0.1:${address.port}`;
  });

  afterEach(async () => {
    clients.forEach((client) => client.disconnect());
    clients.length = 0;
    await new Promise<void>((resolve) => realtimeServer.close(resolve));
  });

  const client = (cookie?: string, origin = "http://localhost:5173") => {
    const socket = createClient(serverUrl, {
      transports: ["websocket"],
      forceNew: true,
      reconnection: false,
      extraHeaders: {
        Origin: origin,
        ...(cookie ? { Cookie: cookie } : {}),
      },
    });
    clients.push(socket);
    return socket;
  };

  const waitForConnection = (socket: ClientSocket) => new Promise<void>((resolve, reject) => {
    socket.once("connect", resolve);
    socket.once("connect_error", reject);
  });

  const joinProject = (socket: ClientSocket) => new Promise<{ ok: boolean; error?: string }>((resolve) => {
    socket.emit("project:join", { projectId }, resolve);
  });

  it("rejects a connection without an authenticated session cookie", async () => {
    const socket = client();
    const error = await new Promise<Error & { data?: { code?: string } }>((resolve) => {
      socket.once("connect_error", resolve);
    });

    expect(error.data?.code).toBe("UNAUTHENTICATED");
    expect(socket.connected).toBe(false);
  });

  it("rejects a browser connection from an untrusted origin", async () => {
    const socket = client(authCookie(), "https://attacker.example");
    await expect(new Promise<void>((resolve, reject) => {
      socket.once("connect", resolve);
      socket.once("connect_error", reject);
    })).rejects.toBeDefined();
    expect(socket.connected).toBe(false);
  });

  it("broadcasts project changes only after an authenticated member joins", async () => {
    const socket = client(authCookie());
    await waitForConnection(socket);
    await expect(joinProject(socket)).resolves.toEqual({ ok: true });

    const eventPromise = new Promise<{ projectId: string; taskId: string }>((resolve) => {
      socket.once("task:created", resolve);
    });
    publishRealtimeEvent({ type: "task:created", projectId, taskId });

    await expect(eventPromise).resolves.toEqual({ type: "task:created", projectId, taskId });
    expect(databaseMocks.membershipFindUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { projectId_userId: { projectId, userId } },
    }));
  });

  it("denies project-room access to an authenticated outsider", async () => {
    databaseMocks.membershipFindUnique.mockResolvedValueOnce(null);
    const socket = client(authCookie());
    await waitForConnection(socket);

    await expect(joinProject(socket)).resolves.toEqual({
      ok: false,
      error: "PROJECT_ACCESS_DENIED",
    });

    const listener = vi.fn();
    socket.on("task:updated", listener);
    publishRealtimeEvent({ type: "task:updated", projectId, taskId });
    await new Promise((resolve) => setTimeout(resolve, 75));
    expect(listener).not.toHaveBeenCalled();
  });

  it("evicts a removed member before broadcasting later project changes", async () => {
    const socket = client(authCookie());
    await waitForConnection(socket);
    await expect(joinProject(socket)).resolves.toEqual({ ok: true });

    const revocation = new Promise<{ projectId: string }>((resolve) => {
      socket.once("project:access-revoked", resolve);
    });
    publishRealtimeEvent({ type: "project:access-revoked", projectId, userId });
    await expect(revocation).resolves.toEqual({ projectId });

    const listener = vi.fn();
    socket.on("task:updated", listener);
    publishRealtimeEvent({ type: "task:updated", projectId, taskId });
    await new Promise((resolve) => setTimeout(resolve, 75));
    expect(listener).not.toHaveBeenCalled();
  });
});
