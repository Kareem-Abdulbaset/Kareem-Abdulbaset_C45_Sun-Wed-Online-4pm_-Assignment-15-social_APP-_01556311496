import { Module } from "@nestjs/common";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { PushNotificationService } from "../../common/services/push-notification.service";
import { RedisService } from "../../common/services/redis.service";

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, PushNotificationService, RedisService],
  exports: [NotificationsService]
})
export class NotificationsModule {}
