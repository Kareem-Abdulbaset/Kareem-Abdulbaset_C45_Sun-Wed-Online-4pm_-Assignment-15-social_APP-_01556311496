import { Module } from "@nestjs/common";
import { CommentsController } from "./comments.controller";
import { CommentsService } from "./comments.service";
import { RedisService } from "../../common/services/redis.service";
import { TokenService } from "../../common/services/token.service";

@Module({
  controllers: [CommentsController],
  providers: [CommentsService, RedisService, TokenService],
  exports: [CommentsService]
})
export class CommentsModule {}
