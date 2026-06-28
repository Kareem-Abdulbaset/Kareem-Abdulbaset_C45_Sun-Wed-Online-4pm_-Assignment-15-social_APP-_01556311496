import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { Auth } from "../../common/decorators/auth.decorator";
import { User } from "../../common/decorators/current-user.decorator";
import { UserDocument } from "../../models/user.model";

@Controller("api/notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Auth()
  @Post("fcm-token")
  async storeFcmToken(@User() user: UserDocument, @Body() body: any) {
    return this.notificationsService.storeFcmToken(user, body);
  }

  @Auth()
  @Delete("fcm-token")
  async removeFcmToken(@User() user: UserDocument, @Body() body: any) {
    return this.notificationsService.removeFcmToken(user, body);
  }

  @Auth()
  @Post("test")
  async sendNotificationToMe(@User() user: UserDocument, @Body() body: any) {
    return this.notificationsService.sendNotificationToMe(user, body);
  }

  @Auth()
  @Get("me")
  async getMyNotifications(@User() user: UserDocument, @Query() query: any) {
    return this.notificationsService.getMyNotifications(user._id, query);
  }

  @Auth("admin")
  @Post()
  async createNotification(@User() user: UserDocument, @Body() body: any) {
    return this.notificationsService.createNotification(user._id, body);
  }

  @Auth("admin")
  @Get()
  async getAllNotifications(@Query() query: any) {
    return this.notificationsService.getAllNotifications(query);
  }

  @Auth()
  @Get(":id")
  async getNotification(@Param("id") id: string, @User() user: UserDocument) {
    return this.notificationsService.getNotification(id, user);
  }

  @Auth()
  @Patch(":id/read")
  async markNotificationAsRead(@Param("id") id: string, @User() user: UserDocument) {
    return this.notificationsService.markNotificationAsRead(id, user);
  }

  @Auth("admin")
  @Patch(":id")
  async updateNotification(@Param("id") id: string, @Body() body: any) {
    return this.notificationsService.updateNotification(id, body);
  }

  @Auth("admin")
  @Delete(":id")
  async softDeleteNotification(@Param("id") id: string) {
    return this.notificationsService.softDeleteNotification(id);
  }

  @Auth("admin")
  @Patch(":id/restore")
  async restoreNotification(@Param("id") id: string) {
    return this.notificationsService.restoreNotification(id);
  }

  @Auth("admin")
  @Delete(":id/hard")
  async hardDeleteNotification(@Param("id") id: string) {
    return this.notificationsService.hardDeleteNotification(id);
  }

  @Auth("admin")
  @Post(":id/send")
  async sendNotification(@Param("id") id: string) {
    return this.notificationsService.sendNotification(id);
  }
}
