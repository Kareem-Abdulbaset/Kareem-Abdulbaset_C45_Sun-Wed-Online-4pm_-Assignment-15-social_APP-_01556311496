import { Document, Schema, Types, model } from "mongoose";
import { ReactionType, reactionTypes } from "../utils/reaction";

export interface CommentReaction {
  user: Types.ObjectId;
  type: ReactionType;
  createdAt: Date;
}

export interface CommentDocument extends Document {
  _id: Types.ObjectId;
  post: Types.ObjectId;
  user: Types.ObjectId;
  content: string;
  reactions: CommentReaction[];
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const reactionSchema = new Schema<CommentReaction>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    type: {
      type: String,
      enum: reactionTypes,
      required: true
    }
  },
  {
    _id: false,
    timestamps: {
      createdAt: true,
      updatedAt: false
    }
  }
);

const commentSchema = new Schema<CommentDocument>(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 1000
    },
    reactions: {
      type: [reactionSchema],
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

commentSchema.index({ post: 1, deletedAt: 1, createdAt: -1 });
commentSchema.index({ user: 1, deletedAt: 1, createdAt: -1 });

export const Comment = model<CommentDocument>("Comment", commentSchema);
