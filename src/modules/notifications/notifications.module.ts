import { Module } from "@nestjs/common";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { PushNotificationService } from "../../common/services/push-notification.service";
import { RedisService } from "../../common/services/redis.service";
import { TokenService } from "../../common/services/token.service";

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, PushNotificationService, RedisService, TokenService],
  exports: [NotificationsService]
})
export class NotificationsModule {}
