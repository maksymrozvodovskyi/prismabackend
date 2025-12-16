import express from "express";
import cors from "cors";
import { errorHandler } from "./middlewares/errorHandler";
import { notFoundHandler } from "./middlewares/notFoundHandler";

import userRoutes from "./routes/users.routes";
import projectRoutes from "./routes/projects.routes";
import workLogRoutes from "./routes/workLogs.routes";

export const app = express();

app.use(cors());
app.use(express.json());

app.use("/users", userRoutes);
app.use("/projects", projectRoutes);
app.use("/work-logs", workLogRoutes);

app.use(notFoundHandler);

app.use(errorHandler);
