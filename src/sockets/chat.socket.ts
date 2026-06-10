import { Server as HttpServer } from "http";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Types } from "mongoose";
import { Server, Socket } from "socket.io";
import { env } from "../config/env";
import { Chat, ChatDocument } from "../models/chat.model";
import { User, UserDocument } from "../models/user.model";
import { isTokenBlacklisted } from "../services/redis.service";

type SocketCallback = (data: any) => void;

const readText = (value: unknown) => {
  return typeof value === "string" ? value.trim() : "";
};

const sendSocketError = (callback: SocketCallback | undefined, message: string) => {
  if (callback) {
    callback({
      success: false,
      message
    });
  }
};

const addMessage = async (chat: ChatDocument, user: UserDocument, text: string) => {
  chat.messages.push({
    sender: user._id,
    text
  } as any);

  await chat.save();

  const message = chat.messages[chat.messages.length - 1];

  return {
    _id: message._id,
    sender: {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar
    },
    text: message.text,
    createdAt: message.createdAt
  };
};

const getPrivateChat = async (user: UserDocument, receiverId: string) => {
  if (!receiverId || !Types.ObjectId.isValid(receiverId) || user._id.toString() === receiverId) {
    return null;
  }

  const receiver = await User.findOne({ _id: receiverId, deletedAt: null });

  if (!receiver) {
    return null;
  }

  let chat = await Chat.findOne({
    type: "private",
    users: { $all: [user._id, receiver._id], $size: 2 },
    deletedAt: null
  });

  if (!chat) {
    chat = await Chat.create({
      type: "private",
      users: [user._id, receiver._id],
      admins: [user._id]
    });
  }

  return chat;
};

const authSocket = async (socket: Socket, next: (error?: Error) => void) => {
  try {
    const authToken = socket.handshake.auth?.token;
    const headerToken = socket.handshake.headers.authorization;
    const tokenValue = typeof authToken === "string" && authToken ? authToken : headerToken;
    const token = typeof tokenValue === "string" && tokenValue.startsWith("Bearer ") ? tokenValue.split(" ")[1] : tokenValue;

    if (!token || typeof token !== "string") {
      return next(new Error("Token is required"));
    }

    if (await isTokenBlacklisted(token)) {
      return next(new Error("Please login again"));
    }

    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
    const user = await User.findOne({ _id: payload.id, deletedAt: null });

    if (!user) {
      return next(new Error("User not found"));
    }

    socket.data.user = user;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
};

export const setupSocket = (server: HttpServer) => {
  const corsOrigin = env.corsOrigin === "*" ? true : env.corsOrigin.split(",").map((origin) => origin.trim());
  const io = new Server(server, {
    cors: {
      origin: corsOrigin,
      credentials: true
    }
  });

  io.use(authSocket);

  io.on("connection", (socket) => {
    const user = socket.data.user as UserDocument;

    socket.join(user._id.toString());
    socket.emit("connected", {
      success: true,
      userId: user._id
    });

    socket.on("joinRoom", async (chatId: string, callback?: SocketCallback) => {
      if (!Types.ObjectId.isValid(chatId)) {
        return sendSocketError(callback, "Invalid chat id");
      }

      const chat = await Chat.findOne({
        _id: chatId,
        users: user._id,
        deletedAt: null
      });

      if (!chat) {
        return sendSocketError(callback, "Chat not found");
      }

      socket.join(chat._id.toString());

      if (callback) {
        callback({
          success: true,
          chatId: chat._id
        });
      }
    });

    socket.on("sendMessage", async (data: any, callback?: SocketCallback) => {
      const receiverId = readText(data?.receiverId || data?.userId);
      const text = readText(data?.text || data?.message);

      if (!text) {
        return sendSocketError(callback, "Message is required");
      }

      const chat = await getPrivateChat(user, receiverId);

      if (!chat) {
        return sendSocketError(callback, "Receiver not found");
      }

      const message = await addMessage(chat, user, text);
      const result = {
        success: true,
        chatId: chat._id,
        message
      };

      io.to(user._id.toString()).to(receiverId).emit("newMessage", result);

      if (callback) {
        callback(result);
      }
    });

    socket.on("sendGroupMessage", async (data: any, callback?: SocketCallback) => {
      const chatId = readText(data?.chatId || data?.roomId);
      const text = readText(data?.text || data?.message);

      if (!Types.ObjectId.isValid(chatId)) {
        return sendSocketError(callback, "Invalid chat id");
      }

      if (!text) {
        return sendSocketError(callback, "Message is required");
      }

      const chat = await Chat.findOne({
        _id: chatId,
        type: "group",
        users: user._id,
        deletedAt: null
      });

      if (!chat) {
        return sendSocketError(callback, "Group not found");
      }

      const message = await addMessage(chat, user, text);
      const result = {
        success: true,
        chatId: chat._id,
        message
      };

      io.to(chat._id.toString()).emit("newGroupMessage", result);

      if (callback) {
        callback(result);
      }
    });
  });

  return io;
};
