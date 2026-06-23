import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { AuthGuard } from "../../common/guards/auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserDocument } from "../../models/user.model";

@Controller("api/notifications")
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post("fcm-token")
  async storeFcmToken(@CurrentUser() user: UserDocument, @Body() body: any) {
    return this.notificationsService.storeFcmToken(user, body);
  }

  @Delete("fcm-token")
  async removeFcmToken(@CurrentUser() user: UserDocument, @Body() body: any) {
    return this.notificationsService.removeFcmToken(user, body);
  }

  @Post("test")
  async sendNotificationToMe(@CurrentUser() user: UserDocument, @Body() body: any) {
    return this.notificationsService.sendNotificationToMe(user, body);
  }

  @Get("me")
  async getMyNotifications(@CurrentUser() user: UserDocument, @Query() query: any) {
    return this.notificationsService.getMyNotifications(user._id, query);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles("admin")
  async createNotification(@CurrentUser() user: UserDocument, @Body() body: any) {
    return this.notificationsService.createNotification(user._id, body);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles("admin")
  async getAllNotifications(@Query() query: any) {
    return this.notificationsService.getAllNotifications(query);
  }

  @Get(":id")
  async getNotification(@Param("id") id: string, @CurrentUser() user: UserDocument) {
    return this.notificationsService.getNotification(id, user);
  }

  @Patch(":id/read")
  async markNotificationAsRead(@Param("id") id: string, @CurrentUser() user: UserDocument) {
    return this.notificationsService.markNotificationAsRead(id, user);
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles("admin")
  async updateNotification(@Param("id") id: string, @Body() body: any) {
    return this.notificationsService.updateNotification(id, body);
  }

  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles("admin")
  async softDeleteNotification(@Param("id") id: string) {
    return this.notificationsService.softDeleteNotification(id);
  }

  @Patch(":id/restore")
  @UseGuards(RolesGuard)
  @Roles("admin")
  async restoreNotification(@Param("id") id: string) {
    return this.notificationsService.restoreNotification(id);
  }

  @Delete(":id/hard")
  @UseGuards(RolesGuard)
  @Roles("admin")
  async hardDeleteNotification(@Param("id") id: string) {
    return this.notificationsService.hardDeleteNotification(id);
  }

  @Post(":id/send")
  @UseGuards(RolesGuard)
  @Roles("admin")
  async sendNotification(@Param("id") id: string) {
    return this.notificationsService.sendNotification(id);
  }
}
