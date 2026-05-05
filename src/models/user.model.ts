import { Document, Schema, Types, model } from "mongoose";

export type UserRole = "user" | "admin";
export type UserProvider = "local" | "google";

export interface UserDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  googleId?: string;
  password?: string;
  role: UserRole;
  provider: UserProvider;
  isConfirmed: boolean;
  fcmTokens: string[];
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
    passwordChangedAt: Date
  },
  {
    timestamps: true
  }
);

export const User = model<UserDocument>("User", userSchema);
