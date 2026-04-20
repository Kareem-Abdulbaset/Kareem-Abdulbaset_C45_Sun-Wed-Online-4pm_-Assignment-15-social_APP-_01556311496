import app from "./app";
import { connectDB } from "./config/database";
import { env } from "./config/env";
import { connectRedis } from "./config/redis";

const startServer = async () => {
  await connectDB();
  await connectRedis();

  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
};

startServer().catch((error) => {
  console.log(error);
  process.exit(1);
});
