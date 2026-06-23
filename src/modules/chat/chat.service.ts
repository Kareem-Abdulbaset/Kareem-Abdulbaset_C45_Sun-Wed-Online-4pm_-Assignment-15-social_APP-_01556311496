import { Injectable } from "@nestjs/common";
import { Types } from "mongoose";
import { Chat, ChatDocument } from "../../models/chat.model";
import { User, UserDocument } from "../../models/user.model";
import { AppError } from "../../utils/AppError";
import { getPagination } from "../../utils/pagination";

@Injectable()
export class ChatService {
  private chatPopulate = [
    { path: "users", select: "name email avatar" },
    { path: "admins", select: "name email avatar" },
    { path: "messages.sender", select: "name email avatar" }
  ];

  private checkId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid id", 400);
    }
  }

  private readText(value: unknown) {
    return typeof value === "string" ? value.trim() : "";
  }

  private async getChatById(chatId: string, userId: Types.ObjectId, type?: "private" | "group") {
    this.checkId(chatId);

    const filter: any = {
      _id: chatId,
      users: userId,
      deletedAt: null
    };

    if (type) {
      filter.type = type;
    }

    const chat = await Chat.findOne(filter);

    if (!chat) {
      throw new AppError("Chat not found", 404);
    }

    return chat;
  }

  async getPrivateChat(userId: Types.ObjectId, receiverId: string) {
    this.checkId(receiverId);

    if (userId.toString() === receiverId) {
      throw new AppError("You cannot chat with yourself", 400);
    }

    const receiver = await User.findOne({ _id: receiverId, deletedAt: null });

    if (!receiver) {
      throw new AppError("Receiver not found", 404);
    }

    let chat = await Chat.findOne({
      type: "private",
      users: { $all: [userId, receiver._id], $size: 2 },
      deletedAt: null
    });

    if (!chat) {
      chat = await Chat.create({
        type: "private",
        users: [userId, receiver._id],
        admins: [userId]
      });
    }

    return chat;
  }

  async addMessage(chat: ChatDocument, senderId: Types.ObjectId, text: string) {
    chat.messages.push({
      sender: senderId,
      text
    } as any);

    await chat.save();
    return chat.messages[chat.messages.length - 1];
  }

  messageResponse(message: any, user: any) {
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
  }

  async getChatUserData(user: UserDocument) {
    return {
      success: true,
      user
    };
  }

  async getMyChats(userId: Types.ObjectId, query: any) {
    const { page, limit, skip } = getPagination(query);

    const [chats, total] = await Promise.all([
      Chat.find({ users: userId, deletedAt: null })
        .select("name type users admins createdAt updatedAt")
        .populate(this.chatPopulate.slice(0, 2))
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      Chat.countDocuments({ users: userId, deletedAt: null })
    ]);

    return {
      success: true,
      page,
      limit,
      total,
      chats
    };
  }

  async createPrivateChat(userId: Types.ObjectId, body: any) {
    const receiverId = this.readText(body?.receiverId || body?.userId);
    const chat = await this.getPrivateChat(userId, receiverId);

    await chat.populate(this.chatPopulate.slice(0, 2));

    return {
      success: true,
      message: "Chat ready",
      chat
    };
  }

  async getChat(chatId: string, userId: Types.ObjectId, query: any) {
    const { page, limit, skip } = getPagination(query);
    const chat = await this.getChatById(chatId, userId);

    await chat.populate(this.chatPopulate);

    const total = chat.messages.length;
    const messages = chat.messages.slice(skip, skip + limit);
    const chatData: any = chat.toObject();

    chatData.messages = messages;

    return {
      success: true,
      page,
      limit,
      total,
      chat: chatData
    };
  }

  async sendMessage(userId: Types.ObjectId, user: UserDocument, body: any) {
    const text = this.readText(body?.text || body?.message);
    const receiverId = this.readText(body?.receiverId || body?.userId);

    if (!text) {
      throw new AppError("Message is required", 400);
    }

    const chat = await this.getPrivateChat(userId, receiverId);
    const message = await this.addMessage(chat, userId, text);

    return {
      success: true,
      chatId: chat._id,
      message: this.messageResponse(message, user)
    };
  }

  async createGroupChat(userId: Types.ObjectId, body: any) {
    const name = this.readText(body?.name);
    const users = Array.isArray(body?.users) ? body.users : [];

    if (!name) {
      throw new AppError("Group name is required", 400);
    }

    const ids = [userId.toString()];

    for (const id of users) {
      if (!Types.ObjectId.isValid(id)) {
        throw new AppError("Invalid user id", 400);
      }

      if (!ids.includes(id)) {
        ids.push(id);
      }
    }

    const usersCount = await User.countDocuments({ _id: { $in: ids }, deletedAt: null });

    if (usersCount !== ids.length) {
      throw new AppError("Some users not found", 404);
    }

    const chat = await Chat.create({
      name,
      type: "group",
      users: ids,
      admins: [userId]
    });

    await chat.populate(this.chatPopulate.slice(0, 2));

    return {
      success: true,
      message: "Group created",
      chat
    };
  }

  async joinRoom(chatId: string, userId: Types.ObjectId) {
    this.checkId(chatId);

    const chat = await Chat.findOne({ _id: chatId, type: "group", deletedAt: null });

    if (!chat) {
      throw new AppError("Group not found", 404);
    }

    const exists = chat.users.some((id) => id.toString() === userId.toString());

    if (!exists) {
      chat.users.push(userId);
      await chat.save();
    }

    await chat.populate(this.chatPopulate.slice(0, 2));

    return {
      success: true,
      message: "Joined room",
      chat
    };
  }

  async getGroupChat(chatId: string, userId: Types.ObjectId, query: any) {
    const { page, limit, skip } = getPagination(query);
    const chat = await this.getChatById(chatId, userId, "group");

    await chat.populate(this.chatPopulate);

    const total = chat.messages.length;
    const messages = chat.messages.slice(skip, skip + limit);
    const chatData: any = chat.toObject();

    chatData.messages = messages;

    return {
      success: true,
      page,
      limit,
      total,
      chat: chatData
    };
  }

  async sendChatMessage(chatId: string, userId: Types.ObjectId, user: UserDocument, body: any) {
    const text = this.readText(body?.text || body?.message);

    if (!text) {
      throw new AppError("Message is required", 400);
    }

    const chat = await this.getChatById(chatId, userId);
    const message = await this.addMessage(chat, userId, text);

    return {
      success: true,
      chatId: chat._id,
      message: this.messageResponse(message, user)
    };
  }

  async sendGroupMessage(chatId: string, userId: Types.ObjectId, user: UserDocument, body: any) {
    const text = this.readText(body?.text || body?.message);

    if (!text) {
      throw new AppError("Message is required", 400);
    }

    const chat = await this.getChatById(chatId, userId, "group");
    const message = await this.addMessage(chat, userId, text);

    return {
      success: true,
      chatId: chat._id,
      message: this.messageResponse(message, user)
    };
  }
}
