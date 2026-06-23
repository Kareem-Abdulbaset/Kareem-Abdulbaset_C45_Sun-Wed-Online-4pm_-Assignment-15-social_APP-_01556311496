import { NestFactory } from "@nestjs/core";
import mongoose from "mongoose";
import { AppModule } from "./app.module";
import { env } from "./config/env";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";

const bootstrap = async () => {
  // Connect to MongoDB
  await mongoose.connect(env.mongoUrl);
  console.log("MongoDB connected");

  // Create NestJS app
  const corsOrigin = env.corsOrigin === "*" ? true : env.corsOrigin.split(",").map((origin) => origin.trim());
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: corsOrigin, credentials: true });
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(env.port);
  console.log(`Nest server running on port ${env.port}`);
};

bootstrap().catch((error) => {
  console.log(error);
  process.exit(1);
});
