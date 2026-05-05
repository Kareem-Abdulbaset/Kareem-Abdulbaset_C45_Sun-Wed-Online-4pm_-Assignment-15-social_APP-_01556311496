import { Document, Schema, Types, model } from "mongoose";

export type NotificationType = "system" | "post" | "comment" | "story" | "custom";

export interface NotificationDocument extends Document {
  _id: Types.ObjectId;
  title: string;
  body: string;
  type: NotificationType;
  data: Map<string, string>;
  createdBy: Types.ObjectId;
  receiver?: Types.ObjectId;
  readBy: Types.ObjectId[];
  sentAt?: Date | null;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<NotificationDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    type: {
      type: String,
      enum: ["system", "post", "comment", "story", "custom"],
      default: "custom"
    },
    data: {
      type: Map,
      of: String,
      default: {}
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    readBy: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: []
    },
    sentAt: {
      type: Date,
      default: null
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ receiver: 1, deletedAt: 1, createdAt: -1 });
notificationSchema.index({ createdBy: 1, deletedAt: 1, createdAt: -1 });

export const Notification = model<NotificationDocument>("Notification", notificationSchema);
