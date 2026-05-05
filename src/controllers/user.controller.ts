import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { Types } from "mongoose";
import { Comment } from "../models/comment.model";
import { Notification } from "../models/notification.model";
import { Post } from "../models/post.model";
import { Story } from "../models/story.model";
import { User, UserDocument, UserRole } from "../models/user.model";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import { getPagination } from "../utils/pagination";

const checkId = (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid id", 400);
  }
};

const cleanEmail = (email: string) => {
  return email.toLowerCase().trim();
};

const readText = (value: unknown) => {
  return typeof value === "string" ? value.trim() : "";
};

const readUserUpdate = (body: any, isAdmin = false) => {
  const data: Partial<Pick<UserDocument, "name" | "bio" | "avatar" | "coverImage" | "role" | "isConfirmed">> = {};

  if (body?.name !== undefined) {
    const name = readText(body.name);

    if (name.length < 2) {
      throw new AppError("Name must be at least 2 characters", 400);
    }

    data.name = name;
  }

  if (body?.bio !== undefined) {
    const bio = readText(body.bio);

    if (bio.length > 500) {
      throw new AppError("Bio must be less than 500 characters", 400);
    }

    data.bio = bio;
  }

  if (body?.avatar !== undefined) {
    data.avatar = readText(body.avatar);
  }

  if (body?.coverImage !== undefined) {
    data.coverImage = readText(body.coverImage);
  }

  if (isAdmin && body?.role !== undefined) {
    if (!["user", "admin"].includes(body.role)) {
      throw new AppError("Role is invalid", 400);
    }

    data.role = body.role as UserRole;
  }

  if (isAdmin && body?.isConfirmed !== undefined) {
    data.isConfirmed = Boolean(body.isConfirmed);
  }

  if (!Object.keys(data).length) {
    throw new AppError("No data to update", 400);
  }

  return data;
};

const getUserById = async (id: string, includeDeleted = false) => {
  checkId(id);

  const query = includeDeleted ? { _id: id } : { _id: id, deletedAt: null };
  const user = await User.findOne(query);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};

export const createUser = async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    throw new AppError("Name, email and password are required", 400);
  }

  if (password.length < 6) {
    throw new AppError("Password must be at least 6 characters", 400);
  }

  if (role && !["user", "admin"].includes(role)) {
    throw new AppError("Role is invalid", 400);
  }

  const userEmail = cleanEmail(email);
  const exists = await User.findOne({ email: userEmail });

  if (exists) {
    throw new AppError("Email already exists", 409);
  }

  const user = await User.create({
    name,
    email: userEmail,
    password: await bcrypt.hash(password, env.bcryptSalt),
    provider: "local",
    role: role || "user",
    isConfirmed: true
  });

  res.status(201).json({
    success: true,
    message: "User created",
    user
  });
};

export const getAllUsers = async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req.query);
  const includeDeleted = req.query.includeDeleted === "true";
  const filter = includeDeleted ? {} : { deletedAt: null };

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter)
  ]);

  res.json({
    success: true,
    page,
    limit,
    total,
    users
  });
};

export const getUser = async (req: Request, res: Response) => {
  const includeDeleted = req.user?.role === "admin";
  const user = await getUserById(req.params.id, includeDeleted);
  const postsCount = await Post.countDocuments({ user: user._id, deletedAt: null });
  const commentsCount = await Comment.countDocuments({ user: user._id, deletedAt: null });

  res.json({
    success: true,
    postsCount,
    commentsCount,
    user
  });
};

export const updateMe = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not found", 401);
  }

  const data = readUserUpdate(req.body);

  Object.assign(req.user, data);
  await req.user.save();

  res.json({
    success: true,
    message: "Profile updated",
    user: req.user
  });
};

export const updateUser = async (req: Request, res: Response) => {
  const user = await getUserById(req.params.id, true);
  const data = readUserUpdate(req.body, true);

  Object.assign(user, data);
  await user.save();

  res.json({
    success: true,
    message: "User updated",
    user
  });
};

export const softDeleteMe = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not found", 401);
  }

  if (!req.user.deletedAt) {
    req.user.deletedAt = new Date();
    await req.user.save();
  }

  res.json({
    success: true,
    message: "Account deleted"
  });
};

export const softDeleteUser = async (req: Request, res: Response) => {
  const user = await getUserById(req.params.id, true);

  if (!user.deletedAt) {
    user.deletedAt = new Date();
    await user.save();
  }

  res.json({
    success: true,
    message: "User deleted"
  });
};

export const restoreUser = async (req: Request, res: Response) => {
  const user = await getUserById(req.params.id, true);
  const deletedAt = user.deletedAt;
  const posts = deletedAt ? await Post.find({ user: user._id, deletedAt }).select("_id") : [];
  const postIds = posts.map((post) => post._id);

  user.deletedAt = null;
  await user.save();

  if (deletedAt) {
    await Post.updateMany({ user: user._id, deletedAt }, { deletedAt: null });
    await Comment.updateMany(
      {
        deletedAt,
        $or: [{ user: user._id }, { post: { $in: postIds } }]
      },
      { deletedAt: null }
    );
    await Story.updateMany({ user: user._id, deletedAt }, { deletedAt: null });
    await Notification.updateMany(
      {
        deletedAt,
        $or: [{ createdBy: user._id }, { receiver: user._id }]
      },
      { deletedAt: null }
    );
  }

  res.json({
    success: true,
    message: "User restored",
    user
  });
};

export const hardDeleteUser = async (req: Request, res: Response) => {
  const user = await getUserById(req.params.id, true);

  await user.deleteOne();

  res.json({
    success: true,
    message: "User hard deleted"
  });
};

export const getDashboard = async (req: Request, res: Response) => {
  const now = new Date();

  const [
    usersCount,
    postsCount,
    commentsCount,
    storiesCount,
    notificationsCount,
    deletedUsersCount,
    recentUsers,
    recentPosts
  ] = await Promise.all([
    User.countDocuments({ deletedAt: null }),
    Post.countDocuments({ deletedAt: null }),
    Comment.countDocuments({ deletedAt: null }),
    Story.countDocuments({ deletedAt: null, expiresAt: { $gt: now } }),
    Notification.countDocuments({ deletedAt: null }),
    User.countDocuments({ deletedAt: { $ne: null } }),
    User.find({ deletedAt: null }).sort({ createdAt: -1 }).limit(5),
    Post.find({ deletedAt: null }).populate("user", "name email avatar").sort({ createdAt: -1 }).limit(5)
  ]);

  res.json({
    success: true,
    dashboard: {
      usersCount,
      postsCount,
      commentsCount,
      storiesCount,
      notificationsCount,
      deletedUsersCount,
      recentUsers,
      recentPosts
    }
  });
};
