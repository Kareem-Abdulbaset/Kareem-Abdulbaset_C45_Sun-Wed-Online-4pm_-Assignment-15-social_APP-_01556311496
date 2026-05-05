import cors from "cors";
import express from "express";
import authRoutes from "./routes/auth.routes";
import commentRoutes from "./routes/comment.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import feedRoutes from "./routes/feed.routes";
import notificationRoutes from "./routes/notification.routes";
import postRoutes from "./routes/post.routes";
import storyRoutes from "./routes/story.routes";
import userRoutes from "./routes/user.routes";
import { env } from "./config/env";
import { AppError } from "./utils/AppError";
import { errorMiddleware } from "./middlewares/error.middleware";

const app = express();
const corsOrigin = env.corsOrigin === "*" ? true : env.corsOrigin.split(",").map((origin) => origin.trim());

app.set("trust proxy", 1);
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    environment: env.nodeEnv
  });
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Social media app backend"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use((req, res, next) => {
  next(new AppError("Route not found", 404));
});

app.use(errorMiddleware);

export default app;
