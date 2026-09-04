import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { healthRouter } from "./health.routes.js";
import { projectRouter } from "./project.routes.js";
import { userRouter } from "./user.routes.js";
import { taskRouter } from "./task.routes.js";
import { commentRouter } from "./comment.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/projects", projectRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/tasks", taskRouter);
apiRouter.use("/comments", commentRouter);
