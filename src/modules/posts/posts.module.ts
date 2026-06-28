import { Module } from "@nestjs/common";
import { PostsController } from "./posts.controller";
import { PostsService } from "./posts.service";
import { RedisService } from "../../common/services/redis.service";
import { TokenService } from "../../common/services/token.service";

@Module({
  controllers: [PostsController],
  providers: [PostsService, RedisService, TokenService],
  exports: [PostsService]
})
export class PostsModule {}
