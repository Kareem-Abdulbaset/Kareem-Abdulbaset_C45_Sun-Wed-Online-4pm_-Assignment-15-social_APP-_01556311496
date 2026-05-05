import { Request, Response } from "express";
import { Types } from "mongoose";
import { Notification, NotificationDocument, NotificationType } from "../models/notification.model";
import { User, UserDocument } from "../models/user.model";
import { sendPushNotificationToTokens } from "../services/notification.service";
import { AppError } from "../utils/AppError";
import { getPagination } from "../utils/pagination";

const checkId = (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid id", 400);
  }
};

const readToken = (body: any) => {
  const token = typeof body?.token === "string" ? body.token.trim() : "";

  if (!token) {
    throw new AppError("Token is required", 400);
  }

  return token;
};

const readData = (value: unknown) => {
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
};

const readNotificationBody = (body: any, partial = false) => {
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
    data.data = readData(body?.data);
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
};

const getUserTokens = (user: UserDocument) => {
  return user.fcmTokens || [];
};

const notificationToData = (notification: NotificationDocument) => {
  const data = notification.data ? Object.fromEntries(notification.data) : {};

  return {
    ...data,
    notificationId: notification._id.toString(),
    type: notification.type
  };
};

const sendToUser = async (user: UserDocument, notification: NotificationDocument) => {
  const tokens = getUserTokens(user);

  if (!tokens.length) {
    return [];
  }

  return sendPushNotificationToTokens(tokens, {
    title: notification.title,
    body: notification.body,
    data: notificationToData(notification)
  });
};

const sendNotificationDocument = async (notification: NotificationDocument) => {
  const users = notification.receiver
    ? await User.find({ _id: notification.receiver, deletedAt: null })
    : await User.find({ deletedAt: null });

  const results = [];

  for (const user of users) {
    const userResults = await sendToUser(user, notification);
    results.push(...userResults);
  }

  notification.sentAt = new Date();
  await notification.save();

  return results;
};

const notificationPopulate = [
  {
    path: "createdBy",
    select: "name email avatar"
  },
  {
    path: "receiver",
    select: "name email avatar"
  },
  {
    path: "readBy",
    select: "name email avatar"
  }
];

const getNotificationById = async (id: string, includeDeleted = false) => {
  checkId(id);

  const query = includeDeleted ? { _id: id } : { _id: id, deletedAt: null };
  const notification = await Notification.findOne(query);

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  return notification;
};

const checkNotificationAccess = (notification: NotificationDocument, user: UserDocument) => {
  if (user.role === "admin") {
    return;
  }

  if (!notification.receiver) {
    return;
  }

  if (notification.receiver.toString() !== user._id.toString()) {
    throw new AppError("You are not allowed", 403);
  }
};

export const storeFcmToken = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not found", 401);
  }

  const token = readToken(req.body);
  const tokens = getUserTokens(req.user);

  if (!tokens.includes(token)) {
    req.user.fcmTokens = [...tokens, token];
    await req.user.save();
  }

  res.json({
    success: true,
    message: "FCM token saved"
  });
};

export const removeFcmToken = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not found", 401);
  }

  const token = readToken(req.body);

  req.user.fcmTokens = getUserTokens(req.user).filter((savedToken) => savedToken !== token);
  await req.user.save();

  res.json({
    success: true,
    message: "FCM token removed"
  });
};

export const createNotification = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not found", 401);
  }

  const data = readNotificationBody(req.body);

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
    createdBy: req.user._id
  });

  let sendResults: unknown[] = [];

  if (req.body?.sendNow === true) {
    sendResults = await sendNotificationDocument(notification);
  }

  await notification.populate(notificationPopulate);

  res.status(201).json({
    success: true,
    message: "Notification created",
    notification,
    sendResults
  });
};

export const getAllNotifications = async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req.query);
  const includeDeleted = req.query.includeDeleted === "true";
  const filter = includeDeleted ? {} : { deletedAt: null };

  const [notifications, total] = await Promise.all([
    Notification.find(filter).populate(notificationPopulate).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter)
  ]);

  res.json({
    success: true,
    page,
    limit,
    total,
    notifications
  });
};

export const getMyNotifications = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not found", 401);
  }

  const { page, limit, skip } = getPagination(req.query);
  const filter = {
    deletedAt: null,
    $or: [{ receiver: req.user._id }, { receiver: { $exists: false } }, { receiver: null }]
  };

  const [notifications, total] = await Promise.all([
    Notification.find(filter).populate(notificationPopulate).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter)
  ]);

  res.json({
    success: true,
    page,
    limit,
    total,
    notifications
  });
};

export const getNotification = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not found", 401);
  }

  const notification = await getNotificationById(req.params.id, req.user.role === "admin");

  checkNotificationAccess(notification, req.user);
  await notification.populate(notificationPopulate);

  res.json({
    success: true,
    notification
  });
};

export const updateNotification = async (req: Request, res: Response) => {
  const notification = await getNotificationById(req.params.id, true);
  const data = readNotificationBody(req.body, true);

  if (data.receiver) {
    const user = await User.findOne({ _id: data.receiver, deletedAt: null });

    if (!user) {
      throw new AppError("Receiver user not found", 404);
    }
  }

  Object.assign(notification, data);
  await notification.save();
  await notification.populate(notificationPopulate);

  res.json({
    success: true,
    message: "Notification updated",
    notification
  });
};

export const softDeleteNotification = async (req: Request, res: Response) => {
  const notification = await getNotificationById(req.params.id, true);

  if (!notification.deletedAt) {
    notification.deletedAt = new Date();
    await notification.save();
  }

  res.json({
    success: true,
    message: "Notification deleted"
  });
};

export const restoreNotification = async (req: Request, res: Response) => {
  const notification = await getNotificationById(req.params.id, true);

  notification.deletedAt = null;
  await notification.save();
  await notification.populate(notificationPopulate);

  res.json({
    success: true,
    message: "Notification restored",
    notification
  });
};

export const hardDeleteNotification = async (req: Request, res: Response) => {
  const notification = await getNotificationById(req.params.id, true);

  await notification.deleteOne();

  res.json({
    success: true,
    message: "Notification hard deleted"
  });
};

export const sendNotification = async (req: Request, res: Response) => {
  const notification = await getNotificationById(req.params.id);
  const results = await sendNotificationDocument(notification);

  res.json({
    success: true,
    message: "Notification sent",
    results
  });
};

export const sendNotificationToMe = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not found", 401);
  }

  const data = readNotificationBody(req.body);
  const notification = new Notification({
    title: data.title,
    body: data.body,
    type: data.type,
    data: data.data,
    receiver: req.user._id,
    createdBy: req.user._id
  });

  const results = await sendToUser(req.user, notification);

  res.json({
    success: true,
    results
  });
};

export const markNotificationAsRead = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not found", 401);
  }

  const notification = await getNotificationById(req.params.id);

  checkNotificationAccess(notification, req.user);

  const exists = notification.readBy.some((userId) => userId.toString() === req.user?._id.toString());

  if (!exists) {
    notification.readBy.push(req.user._id);
    await notification.save();
  }

  res.json({
    success: true,
    message: "Notification read",
    notification
  });
};
