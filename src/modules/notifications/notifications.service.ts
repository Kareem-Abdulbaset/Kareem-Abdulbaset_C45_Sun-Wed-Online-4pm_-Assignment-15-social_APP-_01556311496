import { Injectable } from "@nestjs/common";
import { Types } from "mongoose";
import { Notification, NotificationDocument, NotificationType } from "../../models/notification.model";
import { User, UserDocument } from "../../models/user.model";
import { PushNotificationService } from "../../common/services/push-notification.service";
import { AppError } from "../../utils/AppError";
import { getPagination } from "../../utils/pagination";

@Injectable()
export class NotificationsService {
  constructor(private readonly pushService: PushNotificationService) {}

  private checkId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid id", 400);
    }
  }

  private readToken(body: any) {
    const token = typeof body?.token === "string" ? body.token.trim() : "";

    if (!token) {
      throw new AppError("Token is required", 400);
    }

    return token;
  }

  private readData(value: unknown) {
    const data: Record<string, string> = {};

    if (value === undefined) {
      return data;
    }

    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new AppError("Data must be an object", 400);
    }

    for (const key of Object.keys(value)) {
      data[key] = String((value as Record<string, unknown>)[key]);
    }

    return data;
  }

  private readNotificationBody(body: any, partial = false) {
    const data: {
      title?: string;
      body?: string;
      type?: NotificationType;
      data?: Record<string, string>;
      receiver?: Types.ObjectId;
    } = {};

    if (!partial || body?.title !== undefined) {
      const title = typeof body?.title === "string" ? body.title.trim() : "";

      if (!title) {
        throw new AppError("Title is required", 400);
      }

      data.title = title;
    }

    if (!partial || body?.body !== undefined) {
      const message = typeof body?.body === "string" ? body.body.trim() : "";

      if (!message) {
        throw new AppError("Body is required", 400);
      }

      data.body = message;
    }

    if (body?.type !== undefined) {
      if (!["system", "post", "comment", "story", "custom"].includes(body.type)) {
        throw new AppError("Notification type is invalid", 400);
      }

      data.type = body.type;
    } else if (!partial) {
      data.type = "custom";
    }

    if (body?.data !== undefined || !partial) {
      data.data = this.readData(body?.data);
    }

    if (body?.userId !== undefined && body.userId !== null && body.userId !== "") {
      if (!Types.ObjectId.isValid(body.userId)) {
        throw new AppError("Valid userId is required", 400);
      }

      data.receiver = new Types.ObjectId(body.userId);
    }

    if (partial && !Object.keys(data).length) {
      throw new AppError("No data to update", 400);
    }

    return data;
  }

  private getUserTokens(user: UserDocument) {
    return user.fcmTokens || [];
  }

  private notificationToData(notification: NotificationDocument) {
    const data = notification.data ? Object.fromEntries(notification.data) : {};

    return {
      ...data,
      notificationId: notification._id.toString(),
      type: notification.type
    };
  }

  private async sendToUser(user: UserDocument, notification: NotificationDocument) {
    const tokens = this.getUserTokens(user);

    if (!tokens.length) {
      return [];
    }

    return this.pushService.sendPushNotificationToTokens(tokens, {
      title: notification.title,
      body: notification.body,
      data: this.notificationToData(notification)
    });
  }

  private async sendNotificationDocument(notification: NotificationDocument) {
    const users = notification.receiver
      ? await User.find({ _id: notification.receiver, deletedAt: null })
      : await User.find({ deletedAt: null });

    const results = [];

    for (const user of users) {
      const userResults = await this.sendToUser(user, notification);
      results.push(...userResults);
    }

    notification.sentAt = new Date();
    await notification.save();

    return results;
  }

  private notificationPopulate = [
    { path: "createdBy", select: "name email avatar" },
    { path: "receiver", select: "name email avatar" },
    { path: "readBy", select: "name email avatar" }
  ];

  private async getNotificationById(id: string, includeDeleted = false) {
    this.checkId(id);

    const query = includeDeleted ? { _id: id } : { _id: id, deletedAt: null };
    const notification = await Notification.findOne(query);

    if (!notification) {
      throw new AppError("Notification not found", 404);
    }

    return notification;
  }

  private checkNotificationAccess(notification: NotificationDocument, user: UserDocument) {
    if (user.role === "admin") {
      return;
    }

    if (!notification.receiver) {
      return;
    }

    if (notification.receiver.toString() !== user._id.toString()) {
      throw new AppError("You are not allowed", 403);
    }
  }

  async storeFcmToken(user: UserDocument, body: any) {
    const token = this.readToken(body);
    const tokens = this.getUserTokens(user);

    if (!tokens.includes(token)) {
      user.fcmTokens = [...tokens, token];
      await user.save();
    }

    return {
      success: true,
      message: "FCM token saved"
    };
  }

  async removeFcmToken(user: UserDocument, body: any) {
    const token = this.readToken(body);

    user.fcmTokens = this.getUserTokens(user).filter((savedToken) => savedToken !== token);
    await user.save();

    return {
      success: true,
      message: "FCM token removed"
    };
  }

  async createNotification(userId: Types.ObjectId, body: any) {
    const data = this.readNotificationBody(body);

    if (data.receiver) {
      const user = await User.findOne({ _id: data.receiver, deletedAt: null });

      if (!user) {
        throw new AppError("Receiver user not found", 404);
      }
    }

    const notification = await Notification.create({
      title: data.title,
      body: data.body,
      type: data.type,
      data: data.data,
      receiver: data.receiver,
      createdBy: userId
    });

    let sendResults: unknown[] = [];

    if (body?.sendNow === true) {
      sendResults = await this.sendNotificationDocument(notification);
    }

    await notification.populate(this.notificationPopulate);

    return {
      success: true,
      message: "Notification created",
      notification,
      sendResults
    };
  }

  async getAllNotifications(query: any) {
    const { page, limit, skip } = getPagination(query);
    const includeDeleted = query.includeDeleted === "true";
    const filter = includeDeleted ? {} : { deletedAt: null };

    const [notifications, total] = await Promise.all([
      Notification.find(filter).populate(this.notificationPopulate).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(filter)
    ]);

    return {
      success: true,
      page,
      limit,
      total,
      notifications
    };
  }

  async getMyNotifications(userId: Types.ObjectId, query: any) {
    const { page, limit, skip } = getPagination(query);
    const filter = {
      deletedAt: null,
      $or: [{ receiver: userId }, { receiver: { $exists: false } }, { receiver: null }]
    };

    const [notifications, total] = await Promise.all([
      Notification.find(filter).populate(this.notificationPopulate).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(filter)
    ]);

    return {
      success: true,
      page,
      limit,
      total,
      notifications
    };
  }

  async getNotification(id: string, user: UserDocument) {
    const notification = await this.getNotificationById(id, user.role === "admin");

    this.checkNotificationAccess(notification, user);
    await notification.populate(this.notificationPopulate);

    return {
      success: true,
      notification
    };
  }

  async updateNotification(id: string, body: any) {
    const notification = await this.getNotificationById(id, true);
    const data = this.readNotificationBody(body, true);

    if (data.receiver) {
      const user = await User.findOne({ _id: data.receiver, deletedAt: null });

      if (!user) {
        throw new AppError("Receiver user not found", 404);
      }
    }

    Object.assign(notification, data);
    await notification.save();
    await notification.populate(this.notificationPopulate);

    return {
      success: true,
      message: "Notification updated",
      notification
    };
  }

  async softDeleteNotification(id: string) {
    const notification = await this.getNotificationById(id, true);

    if (!notification.deletedAt) {
      notification.deletedAt = new Date();
      await notification.save();
    }

    return {
      success: true,
      message: "Notification deleted"
    };
  }

  async restoreNotification(id: string) {
    const notification = await this.getNotificationById(id, true);

    notification.deletedAt = null;
    await notification.save();
    await notification.populate(this.notificationPopulate);

    return {
      success: true,
      message: "Notification restored",
      notification
    };
  }

  async hardDeleteNotification(id: string) {
    const notification = await this.getNotificationById(id, true);

    await notification.deleteOne();

    return {
      success: true,
      message: "Notification hard deleted"
    };
  }

  async sendNotification(id: string) {
    const notification = await this.getNotificationById(id);
    const results = await this.sendNotificationDocument(notification);

    return {
      success: true,
      message: "Notification sent",
      results
    };
  }

  async sendNotificationToMe(user: UserDocument, body: any) {
    const data = this.readNotificationBody(body);
    const notification = new Notification({
      title: data.title,
      body: data.body,
      type: data.type,
      data: data.data,
      receiver: user._id,
      createdBy: user._id
    });

    const results = await this.sendToUser(user, notification);

    return {
      success: true,
      results
    };
  }

  async markNotificationAsRead(id: string, user: UserDocument) {
    const notification = await this.getNotificationById(id);

    this.checkNotificationAccess(notification, user);

    const exists = notification.readBy.some((userId) => userId.toString() === user._id.toString());

    if (!exists) {
      notification.readBy.push(user._id);
      await notification.save();
    }

    return {
      success: true,
      message: "Notification read",
      notification
    };
  }
}
