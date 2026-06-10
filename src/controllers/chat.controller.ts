import { Request, Response } from "express";
import { Types } from "mongoose";
import { Chat, ChatDocument } from "../models/chat.model";
import { User } from "../models/user.model";
import { AppError } from "../utils/AppError";
import { getPagination } from "../utils/pagination";

const chatPopulate = [
  { path: "users", select: "name email avatar" },
  { path: "admins", select: "name email avatar" },
  { path: "messages.sender", select: "name email avatar" }
];

const checkId = (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid id", 400);
  }
};

const readText = (value: unknown) => {
  return typeof value === "string" ? value.trim() : "";
};

const getMe = (req: Request) => {
  if (!req.user) {
    throw new AppError("User not found", 401);
  }

  return req.user;
};

const getChatById = async (chatId: string, userId: Types.ObjectId, type?: "private" | "group") => {
  checkId(chatId);

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
};

const getPrivateChat = async (userId: Types.ObjectId, receiverId: string) => {
  checkId(receiverId);

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
};

const addMessage = async (chat: ChatDocument, senderId: Types.ObjectId, text: string) => {
  chat.messages.push({
    sender: senderId,
    text
  } as any);

  await chat.save();
  return chat.messages[chat.messages.length - 1];
};

const messageResponse = (message: any, user: any) => {
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

export const getChatUserData = async (req: Request, res: Response) => {
  const user = getMe(req);

  res.json({
    success: true,
    user
  });
};

export const getMyChats = async (req: Request, res: Response) => {
  const user = getMe(req);
  const { page, limit, skip } = getPagination(req.query);

  const [chats, total] = await Promise.all([
    Chat.find({ users: user._id, deletedAt: null })
      .select("name type users admins createdAt updatedAt")
      .populate(chatPopulate.slice(0, 2))
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit),
    Chat.countDocuments({ users: user._id, deletedAt: null })
  ]);

  res.json({
    success: true,
    page,
    limit,
    total,
    chats
  });
};

export const createPrivateChat = async (req: Request, res: Response) => {
  const user = getMe(req);
  const receiverId = readText(req.body?.receiverId || req.body?.userId);
  const chat = await getPrivateChat(user._id, receiverId);

  await chat.populate(chatPopulate.slice(0, 2));

  res.status(201).json({
    success: true,
    message: "Chat ready",
    chat
  });
};

export const getChat = async (req: Request, res: Response) => {
  const user = getMe(req);
  const { page, limit, skip } = getPagination(req.query);
  const chat = await getChatById(req.params.id, user._id);

  await chat.populate(chatPopulate);

  const total = chat.messages.length;
  const messages = chat.messages.slice(skip, skip + limit);
  const chatData: any = chat.toObject();

  chatData.messages = messages;

  res.json({
    success: true,
    page,
    limit,
    total,
    chat: chatData
  });
};

export const sendMessage = async (req: Request, res: Response) => {
  const user = getMe(req);
  const text = readText(req.body?.text || req.body?.message);
  const receiverId = readText(req.body?.receiverId || req.body?.userId);

  if (!text) {
    throw new AppError("Message is required", 400);
  }

  const chat = await getPrivateChat(user._id, receiverId);
  const message = await addMessage(chat, user._id, text);

  res.status(201).json({
    success: true,
    chatId: chat._id,
    message: messageResponse(message, user)
  });
};

export const createGroupChat = async (req: Request, res: Response) => {
  const user = getMe(req);
  const name = readText(req.body?.name);
  const users = Array.isArray(req.body?.users) ? req.body.users : [];

  if (!name) {
    throw new AppError("Group name is required", 400);
  }

  const ids = [user._id.toString()];

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
    admins: [user._id]
  });

  await chat.populate(chatPopulate.slice(0, 2));

  res.status(201).json({
    success: true,
    message: "Group created",
    chat
  });
};

export const joinRoom = async (req: Request, res: Response) => {
  const user = getMe(req);

  checkId(req.params.id);

  const chat = await Chat.findOne({ _id: req.params.id, type: "group", deletedAt: null });

  if (!chat) {
    throw new AppError("Group not found", 404);
  }

  const exists = chat.users.some((id) => id.toString() === user._id.toString());

  if (!exists) {
    chat.users.push(user._id);
    await chat.save();
  }

  await chat.populate(chatPopulate.slice(0, 2));

  res.json({
    success: true,
    message: "Joined room",
    chat
  });
};

export const getGroupChat = async (req: Request, res: Response) => {
  const user = getMe(req);
  const { page, limit, skip } = getPagination(req.query);
  const chat = await getChatById(req.params.id, user._id, "group");

  await chat.populate(chatPopulate);

  const total = chat.messages.length;
  const messages = chat.messages.slice(skip, skip + limit);
  const chatData: any = chat.toObject();

  chatData.messages = messages;

  res.json({
    success: true,
    page,
    limit,
    total,
    chat: chatData
  });
};

export const sendChatMessage = async (req: Request, res: Response) => {
  const user = getMe(req);
  const text = readText(req.body?.text || req.body?.message);

  if (!text) {
    throw new AppError("Message is required", 400);
  }

  const chat = await getChatById(req.params.id, user._id);
  const message = await addMessage(chat, user._id, text);

  res.status(201).json({
    success: true,
    chatId: chat._id,
    message: messageResponse(message, user)
  });
};

export const sendGroupMessage = async (req: Request, res: Response) => {
  const user = getMe(req);
  const text = readText(req.body?.text || req.body?.message);

  if (!text) {
    throw new AppError("Message is required", 400);
  }

  const chat = await getChatById(req.params.id, user._id, "group");
  const message = await addMessage(chat, user._id, text);

  res.status(201).json({
    success: true,
    chatId: chat._id,
    message: messageResponse(message, user)
  });
};
