import { Module } from "@nestjs/common";
import { CommentsController } from "./comments.controller";
import { CommentsService } from "./comments.service";
import { RedisService } from "../../common/services/redis.service";

@Module({
  controllers: [CommentsController],
  providers: [CommentsService, RedisService],
  exports: [CommentsService]
})
export class CommentsModule {}
