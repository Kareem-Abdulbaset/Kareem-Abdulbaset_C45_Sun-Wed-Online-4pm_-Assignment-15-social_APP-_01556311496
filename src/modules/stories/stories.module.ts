import { Module } from "@nestjs/common";
import { StoriesController } from "./stories.controller";
import { StoriesService } from "./stories.service";
import { RedisService } from "../../common/services/redis.service";
import { TokenService } from "../../common/services/token.service";

@Module({
  controllers: [StoriesController],
  providers: [StoriesService, RedisService, TokenService],
  exports: [StoriesService]
})
export class StoriesModule {}
