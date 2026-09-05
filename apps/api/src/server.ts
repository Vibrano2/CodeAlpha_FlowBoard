import { createServer } from "node:http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./database/prisma.js";
import { createRealtimeServer } from "./realtime/socket-server.js";

const app = createApp();
const httpServer = createServer(app);
const realtimeServer = createRealtimeServer(httpServer);

const server = httpServer.listen(env.port, "0.0.0.0", () => {
  console.info(`FlowBoard API is listening on http://localhost:${env.port}`);
});

server.requestTimeout = 30_000;
server.headersTimeout = 35_000;
server.keepAliveTimeout = 5_000;

const shutdown = (signal: NodeJS.Signals) => {
  console.info(`${signal} received. Closing FlowBoard API.`);

  realtimeServer.close(() => {
    void prisma.$disconnect().finally(() => {
      process.exit(0);
    });
  });

  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
