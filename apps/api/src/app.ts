import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { notFoundHandler } from "./middleware/not-found.middleware.js";
import { verifyRequestOrigin } from "./middleware/origin.middleware.js";
import {
  preventSensitiveResponseCaching,
  requireJsonRequestBody,
} from "./middleware/request-security.middleware.js";
import { apiRouter } from "./routes/index.js";

export const createApp = () => {
  const app = express();

  app.disable("x-powered-by");
  if (env.trustProxyHops > 0) app.set("trust proxy", env.trustProxyHops);
  app.use(helmet());
  app.use(
    cors({
      credentials: true,
      origin(origin, callback) {
        if (!origin || env.clientOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(null, false);
      },
    }),
  );
  app.use(preventSensitiveResponseCaching);
  app.use(verifyRequestOrigin);
  app.use(requireJsonRequestBody);
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  app.use("/api/v1", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
