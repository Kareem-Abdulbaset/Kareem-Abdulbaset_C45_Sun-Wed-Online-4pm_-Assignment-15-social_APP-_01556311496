import "reflect-metadata";
import { Controller, Get, Module } from "@nestjs/common";
import { env } from "./config/env";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { PostsModule } from "./modules/posts/posts.module";
import { CommentsModule } from "./modules/comments/comments.module";
import { StoriesModule } from "./modules/stories/stories.module";
import { ChatModule } from "./modules/chat/chat.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { FeedModule } from "./modules/feed/feed.module";
import { GraphqlModule } from "./modules/graphql/graphql.module";

@Controller()
class AppController {
  @Get("health")
  getHealth() {
    return {
      success: true,
      status: "ok",
      environment: env.nodeEnv
    };
  }

  @Get()
  getRoot() {
    return {
      success: true,
      message: "Social media app backend"
    };
  }
}

@Module({
  imports: [
    AuthModule,
    UsersModule,
    PostsModule,
    CommentsModule,
    StoriesModule,
    ChatModule,
    NotificationsModule,
    DashboardModule,
    FeedModule,
    GraphqlModule
  ],
  controllers: [AppController]
})
export class AppModule {}
