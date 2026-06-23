import { Module } from "@nestjs/common";
import { StoriesController } from "./stories.controller";
import { StoriesService } from "./stories.service";
import { RedisService } from "../../common/services/redis.service";

@Module({
  controllers: [StoriesController],
  providers: [StoriesService, RedisService],
  exports: [StoriesService]
})
export class StoriesModule {}
