import { Module } from "@nestjs/common";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";
import { ChatGateway } from "./chat.gateway";
import { RedisService } from "../../common/services/redis.service";
import { TokenService } from "../../common/services/token.service";

@Module({
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, RedisService, TokenService],
  exports: [ChatService]
})
export class ChatModule {}
