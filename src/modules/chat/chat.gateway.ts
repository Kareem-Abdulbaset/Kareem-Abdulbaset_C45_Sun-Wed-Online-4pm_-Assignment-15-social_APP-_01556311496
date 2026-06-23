import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from "@nestjs/websockets";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Types } from "mongoose";
import { Server, Socket } from "socket.io";
import { env } from "../../config/env";
import { Chat } from "../../models/chat.model";
import { User, UserDocument } from "../../models/user.model";
import { RedisService } from "../../common/services/redis.service";
import { ChatService } from "./chat.service";

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

@WebSocketGateway({
  cors: {
    origin: env.corsOrigin === "*" ? true : env.corsOrigin.split(",").map((origin) => origin.trim()),
    credentials: true
  }
})
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly redisService: RedisService,
    private readonly chatService: ChatService
  ) {}

  async handleConnection(socket: Socket) {
    try {
      const authToken = socket.handshake.auth?.token;
      const headerToken = socket.handshake.headers.authorization;
      const tokenValue = typeof authToken === "string" && authToken ? authToken : headerToken;
      const token = typeof tokenValue === "string" && tokenValue.startsWith("Bearer ") ? tokenValue.split(" ")[1] : tokenValue;

      if (!token || typeof token !== "string") {
        socket.disconnect();
        return;
      }

      if (await this.redisService.isTokenBlacklisted(token)) {
        socket.disconnect();
        return;
      }

      const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
      const user = await User.findOne({ _id: payload.id, deletedAt: null });

      if (!user) {
        socket.disconnect();
        return;
      }

      socket.data.user = user;
      socket.join(user._id.toString());
      socket.emit("connected", {
        success: true,
        userId: user._id
      });
    } catch {
      socket.disconnect();
    }
  }

  @SubscribeMessage("joinRoom")
  async handleJoinRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: any
  ) {
    const user = socket.data.user as UserDocument;
    const chatId = typeof data === "string" ? data : data?.chatId || data;

    if (!Types.ObjectId.isValid(chatId)) {
      return { success: false, message: "Invalid chat id" };
    }

    const chat = await Chat.findOne({
      _id: chatId,
      users: user._id,
      deletedAt: null
    });

    if (!chat) {
      return { success: false, message: "Chat not found" };
    }

    socket.join(chat._id.toString());

    return {
      success: true,
      chatId: chat._id
    };
  }

  @SubscribeMessage("sendMessage")
  async handleSendMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: any
  ) {
    const user = socket.data.user as UserDocument;
    const receiverId = readText(data?.receiverId || data?.userId);
    const text = readText(data?.text || data?.message);

    if (!text) {
      return { success: false, message: "Message is required" };
    }

    if (!receiverId || !Types.ObjectId.isValid(receiverId) || user._id.toString() === receiverId) {
      return { success: false, message: "Receiver not found" };
    }

    const receiver = await User.findOne({ _id: receiverId, deletedAt: null });

    if (!receiver) {
      return { success: false, message: "Receiver not found" };
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

    const message = await this.chatService.addMessage(chat, user._id, text);
    const result = {
      success: true,
      chatId: chat._id,
      message: this.chatService.messageResponse(message, user)
    };

    this.server.to(user._id.toString()).to(receiverId).emit("newMessage", result);

    return result;
  }

  @SubscribeMessage("sendGroupMessage")
  async handleSendGroupMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: any
  ) {
    const user = socket.data.user as UserDocument;
    const chatId = readText(data?.chatId || data?.roomId);
    const text = readText(data?.text || data?.message);

    if (!Types.ObjectId.isValid(chatId)) {
      return { success: false, message: "Invalid chat id" };
    }

    if (!text) {
      return { success: false, message: "Message is required" };
    }

    const chat = await Chat.findOne({
      _id: chatId,
      type: "group",
      users: user._id,
      deletedAt: null
    });

    if (!chat) {
      return { success: false, message: "Group not found" };
    }

    const message = await this.chatService.addMessage(chat, user._id, text);
    const result = {
      success: true,
      chatId: chat._id,
      message: this.chatService.messageResponse(message, user)
    };

    this.server.to(chat._id.toString()).emit("newGroupMessage", result);

    return result;
  }
}
