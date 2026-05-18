import { Document, Schema, Types, model } from "mongoose";

export type UserRole = "user" | "admin";
export type UserProvider = "local" | "google";

export interface UserDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  googleId?: string;
  password?: string;
  bio?: string;
  avatar?: string;
  coverImage?: string;
  role: UserRole;
  provider: UserProvider;
  isConfirmed: boolean;
  fcmTokens: string[];
  deletedAt?: Date | null;
  passwordChangedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minLength: 2
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true
    },
    password: {
      type: String,
      select: false
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ""
    },
    avatar: {
      type: String,
      trim: true,
      default: ""
    },
    coverImage: {
      type: String,
      trim: true,
      default: ""
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local"
    },
    isConfirmed: {
      type: Boolean,
      default: false
    },
    fcmTokens: {
      type: [String],
      default: []
    },
    deletedAt: {
      type: Date,
      default: null
    },
    passwordChangedAt: Date
  },
  {
    timestamps: true
  }
);

userSchema.index({ deletedAt: 1, createdAt: -1 });

userSchema.pre("save", async function () {
  if (!this.isModified("deletedAt") || !this.deletedAt) {
    return;
  }

  const { Post } = await import("./post.model");
  const { Comment } = await import("./comment.model");
  const { Story } = await import("./story.model");
  const { Notification } = await import("./notification.model");

  const posts = await Post.find({ user: this._id }).select("_id");
  const postIds = posts.map((post) => post._id);

  await Post.updateMany({ user: this._id, deletedAt: null }, { deletedAt: this.deletedAt });
  await Comment.updateMany(
    {
      deletedAt: null,
      $or: [{ createdBy: this._id }, { postId: { $in: postIds } }]
    },
    { deletedAt: this.deletedAt }
  );
  await Story.updateMany({ user: this._id, deletedAt: null }, { deletedAt: this.deletedAt });
  await Notification.updateMany(
    {
      deletedAt: null,
      $or: [{ createdBy: this._id }, { receiver: this._id }]
    },
    { deletedAt: this.deletedAt }
  );
});

userSchema.pre("deleteOne", { document: true, query: false }, async function () {
  const { Post } = await import("./post.model");
  const { Comment } = await import("./comment.model");
  const { Story } = await import("./story.model");
  const { Notification } = await import("./notification.model");

  const posts = await Post.find({ user: this._id }).select("_id");
  const postIds = posts.map((post) => post._id);

  await Comment.deleteMany({
    $or: [{ createdBy: this._id }, { postId: { $in: postIds } }]
  });
  await Post.deleteMany({ user: this._id });
  await Story.deleteMany({ user: this._id });
  await Notification.deleteMany({
    $or: [{ createdBy: this._id }, { receiver: this._id }]
  });
});

export const User = model<UserDocument>("User", userSchema);
