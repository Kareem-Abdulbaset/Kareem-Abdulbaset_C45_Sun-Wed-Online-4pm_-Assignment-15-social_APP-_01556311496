import { Request, Response } from "express";
import { Types } from "mongoose";
import { User, UserDocument } from "../models/user.model";
import { sendPushNotificationToTokens } from "../services/notification.service";
import { AppError } from "../utils/AppError";

const readToken = (body: any) => {
  const token = typeof body?.token === "string" ? body.token.trim() : "";

  if (!token) {
    throw new AppError("Token is required", 400);
  }

  return token;
};

const readNotificationBody = (body: any) => {
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const message = typeof body?.body === "string" ? body.body.trim() : "";
  const data: Record<string, string> = {};

  if (!title || !message) {
    throw new AppError("Title and body are required", 400);
  }

  if (body?.data !== undefined) {
    if (!body.data || typeof body.data !== "object" || Array.isArray(body.data)) {
      throw new AppError("Data must be an object", 400);
    }

    for (const key of Object.keys(body.data)) {
      data[key] = String(body.data[key]);
    }
  }

  return {
    title,
    body: message,
    data
  };
};

const getUserTokens = (user: UserDocument) => {
  return user.fcmTokens || [];
};

const sendToUser = async (user: UserDocument, title: string, body: string, data: Record<string, string>) => {
  const tokens = getUserTokens(user);

  if (!tokens.length) {
    return [];
  }

  return sendPushNotificationToTokens(tokens, {
    title,
    body,
    data
  });
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

export const sendNotificationToMe = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not found", 401);
  }

  const notification = readNotificationBody(req.body);
  const results = await sendToUser(req.user, notification.title, notification.body, notification.data);

  res.json({
    success: true,
    results
  });
};

export const sendNotificationToUser = async (req: Request, res: Response) => {
  const { userId } = req.body;
  const notification = readNotificationBody(req.body);

  if (!userId || !Types.ObjectId.isValid(userId)) {
    throw new AppError("Valid userId is required", 400);
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const results = await sendToUser(user, notification.title, notification.body, notification.data);

  res.json({
    success: true,
    results
  });
};
