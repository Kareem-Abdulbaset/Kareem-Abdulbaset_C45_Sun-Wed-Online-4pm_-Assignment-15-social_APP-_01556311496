import { Module } from "@nestjs/common";
import { FeedController } from "./feed.controller";
import { PostsModule } from "../posts/posts.module";
import { RedisService } from "../../common/services/redis.service";
import { TokenService } from "../../common/services/token.service";

@Module({
  imports: [PostsModule],
  controllers: [FeedController],
  providers: [RedisService, TokenService]
})
export class FeedModule {}
