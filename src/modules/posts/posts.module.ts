import { Module } from "@nestjs/common";
import { PostsController } from "./posts.controller";
import { PostsService } from "./posts.service";
import { RedisService } from "../../common/services/redis.service";

@Module({
  controllers: [PostsController],
  providers: [PostsService, RedisService],
  exports: [PostsService]
})
export class PostsModule {}
