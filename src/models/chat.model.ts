import { Document, Schema, Types, model } from "mongoose";

export type ChatType = "private" | "group";

export interface ChatMessageDocument extends Types.Subdocument {
  _id: Types.ObjectId;
  sender: Types.ObjectId;
  text: string;
  createdAt: Date;
}

export interface ChatDocument extends Document {
  _id: Types.ObjectId;
  name?: string;
  type: ChatType;
  users: Types.ObjectId[];
  admins: Types.ObjectId[];
  messages: Types.DocumentArray<ChatMessageDocument>;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<ChatMessageDocument>({
  sender: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 1000
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const chatSchema = new Schema<ChatDocument>(
  {
    name: {
      type: String,
      trim: true,
      maxlength: 100
    },
    type: {
      type: String,
      enum: ["private", "group"],
      required: true
    },
    users: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      required: true,
      default: []
    },
    admins: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: []
    },
    messages: {
      type: [messageSchema],
      default: []
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

chatSchema.index({ users: 1, type: 1 });
chatSchema.index({ deletedAt: 1, updatedAt: -1 });

export const Chat = model<ChatDocument>("Chat", chatSchema);
