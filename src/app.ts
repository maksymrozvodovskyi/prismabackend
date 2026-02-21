import express from "express";
import cors from "cors";
import pino from "pino-http";
import { errorHandler } from "./middlewares/errorHandler";
import { notFoundHandler } from "./middlewares/notFoundHandler";

import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/users.routes";
import projectRoutes from "./routes/projects.routes";
import workLogRoutes from "./routes/workLogs.routes";
import feedbackRoutes from "./routes/feedback.routes";
import reportRoutes from "./routes/reports.routes";

export const app = express();

app.use(express.json());
app.use(cors());

app.use(
  pino({
    transport: {
      target: 'pino-pretty',
    },
  }),
);

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/projects", projectRoutes);
app.use("/work-logs", workLogRoutes);
app.use("/feedbacks", feedbackRoutes);
app.use("/reports", reportRoutes);

app.use(notFoundHandler);

app.use(errorHandler);
