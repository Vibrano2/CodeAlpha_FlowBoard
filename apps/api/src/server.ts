import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./database/prisma.js";

const app = createApp();

const server = app.listen(env.port, "0.0.0.0", () => {
  console.info(`FlowBoard API is listening on http://localhost:${env.port}`);
});

const shutdown = (signal: NodeJS.Signals) => {
  console.info(`${signal} received. Closing FlowBoard API.`);

  server.close(() => {
    void prisma.$disconnect().finally(() => {
      process.exit(0);
    });
  });

  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
