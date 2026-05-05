import cors from "cors";
import express from "express";
import authRoutes from "./routes/auth.routes";
import notificationRoutes from "./routes/notification.routes";
import postRoutes from "./routes/post.routes";
import userRoutes from "./routes/user.routes";
import { AppError } from "./utils/AppError";
import { errorMiddleware } from "./middlewares/error.middleware";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Social media app backend"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/notifications", notificationRoutes);

app.use((req, res, next) => {
  next(new AppError("Route not found", 404));
});

app.use(errorMiddleware);

export default app;
