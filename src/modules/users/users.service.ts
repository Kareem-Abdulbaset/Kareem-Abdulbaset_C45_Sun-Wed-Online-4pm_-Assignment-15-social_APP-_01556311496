import { Injectable } from "@nestjs/common";
import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import { Comment } from "../../models/comment.model";
import { Notification } from "../../models/notification.model";
import { Post } from "../../models/post.model";
import { Story } from "../../models/story.model";
import { User, UserDocument, UserRole } from "../../models/user.model";
import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";
import { getPagination } from "../../utils/pagination";

@Injectable()
export class UsersService {
  private checkId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid id", 400);
    }
  }

  private readText(value: unknown) {
    return typeof value === "string" ? value.trim() : "";
  }

  private readUserUpdate(body: any, isAdmin = false) {
    const data: Partial<Pick<UserDocument, "name" | "bio" | "avatar" | "coverImage" | "role" | "isConfirmed">> = {};

    if (body?.name !== undefined) {
      const name = this.readText(body.name);

      if (name.length < 2) {
        throw new AppError("Name must be at least 2 characters", 400);
      }

      data.name = name;
    }

    if (body?.bio !== undefined) {
      const bio = this.readText(body.bio);

      if (bio.length > 500) {
        throw new AppError("Bio must be less than 500 characters", 400);
      }

      data.bio = bio;
    }

    if (body?.avatar !== undefined) {
      data.avatar = this.readText(body.avatar);
    }

    if (body?.coverImage !== undefined) {
      data.coverImage = this.readText(body.coverImage);
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
  }

  async getUserById(id: string, includeDeleted = false) {
    this.checkId(id);

    const query = includeDeleted ? { _id: id } : { _id: id, deletedAt: null };
    const user = await User.findOne(query);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }

  async createUser(body: { name: string; email: string; password: string; role?: string }) {
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      throw new AppError("Name, email and password are required", 400);
    }

    if (password.length < 6) {
      throw new AppError("Password must be at least 6 characters", 400);
    }

    if (role && !["user", "admin"].includes(role)) {
      throw new AppError("Role is invalid", 400);
    }

    const userEmail = email.toLowerCase().trim();
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

    return {
      success: true,
      message: "User created",
      user
    };
  }

  async getAllUsers(query: any) {
    const { page, limit, skip } = getPagination(query);
    const includeDeleted = query.includeDeleted === "true";
    const filter = includeDeleted ? {} : { deletedAt: null };

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter)
    ]);

    return {
      success: true,
      page,
      limit,
      total,
      users
    };
  }

  async getUser(id: string, isAdmin: boolean) {
    const user = await this.getUserById(id, isAdmin);
    const postsCount = await Post.countDocuments({ user: user._id, deletedAt: null });
    const commentsCount = await Comment.countDocuments({ createdBy: user._id, deletedAt: null });

    return {
      success: true,
      postsCount,
      commentsCount,
      user
    };
  }

  async updateMe(currentUser: UserDocument, body: any) {
    const data = this.readUserUpdate(body);

    Object.assign(currentUser, data);
    await currentUser.save();

    return {
      success: true,
      message: "Profile updated",
      user: currentUser
    };
  }

  async updateUser(id: string, body: any) {
    const user = await this.getUserById(id, true);
    const data = this.readUserUpdate(body, true);

    Object.assign(user, data);
    await user.save();

    return {
      success: true,
      message: "User updated",
      user
    };
  }

  async softDeleteMe(currentUser: UserDocument) {
    if (!currentUser.deletedAt) {
      currentUser.deletedAt = new Date();
      await currentUser.save();
    }

    return {
      success: true,
      message: "Account deleted"
    };
  }

  async softDeleteUser(id: string) {
    const user = await this.getUserById(id, true);

    if (!user.deletedAt) {
      user.deletedAt = new Date();
      await user.save();
    }

    return {
      success: true,
      message: "User deleted"
    };
  }

  async restoreUser(id: string) {
    const user = await this.getUserById(id, true);
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
          $or: [{ createdBy: user._id }, { postId: { $in: postIds } }]
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

    return {
      success: true,
      message: "User restored",
      user
    };
  }

  async hardDeleteUser(id: string) {
    const user = await this.getUserById(id, true);

    await user.deleteOne();

    return {
      success: true,
      message: "User hard deleted"
    };
  }

  async getDashboard() {
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

    return {
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
    };
  }
}
