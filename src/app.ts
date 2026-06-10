import cors from "cors";
import express from "express";
import { createHandler } from "graphql-http/lib/use/express";
import {
  GraphQLEnumType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString
} from "graphql";
import authRoutes from "./routes/auth.routes";
import chatRoutes from "./routes/chat.routes";
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

type Gender = "male" | "female";

type User = {
  id: number;
  name: string;
  age: number;
  gender: Gender;
};

const users: User[] = [
  { id: 1, name: "first", age: 25, gender: "female" },
  { id: 2, name: "second", age: 26, gender: "female" },
  { id: 3, name: "third", age: 27, gender: "female" }
];

const genderType = new GraphQLEnumType({
  name: "genderType",
  values: {
    male: { value: "male" },
    female: { value: "female" }
  }
});

const userType = new GraphQLObjectType<User>({
  name: "User",
  fields: {
    id: { type: GraphQLInt },
    age: { type: GraphQLInt },
    name: { type: GraphQLString },
    gender: { type: genderType }
  }
});

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: "query",
    fields: {
      users: {
        type: new GraphQLList(userType),
        resolve: () => users
      },
      user: {
        type: userType,
        args: {
          id: { type: new GraphQLNonNull(GraphQLInt) }
        },
        resolve: (_parent, args: { id: number }) => users.find((user) => user.id === args.id) ?? null
      }
    }
  }),
  mutation: new GraphQLObjectType({
    name: "mutation",
    fields: {
      createUser: {
        type: new GraphQLList(userType),
        args: {
          id: { type: new GraphQLNonNull(GraphQLInt) },
          age: { type: new GraphQLNonNull(GraphQLInt) },
          name: { type: new GraphQLNonNull(GraphQLString) },
          gender: { type: new GraphQLNonNull(genderType) }
        },
        resolve: (_parent, args: User) => {
          const userExist = users.find((user) => user.id === args.id);

          if (userExist) {
            throw new AppError("user already exist", 409);
          }

          users.push(args);
          return users;
        }
      }
    }
  })
});

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
app.use("/api/chats", chatRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/graphql", createHandler({ schema }));

app.use((req, res, next) => {
  next(new AppError("Route not found", 404));
});

app.use(errorMiddleware);

export default app;
