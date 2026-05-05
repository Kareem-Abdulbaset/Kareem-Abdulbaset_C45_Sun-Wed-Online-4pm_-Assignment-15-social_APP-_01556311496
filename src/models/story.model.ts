import { Document, Schema, Types, model } from "mongoose";
import { ReactionType, reactionTypes } from "../utils/reaction";

export interface StoryReaction {
  user: Types.ObjectId;
  type: ReactionType;
  createdAt: Date;
}

export interface StoryDocument extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  content?: string;
  media: string[];
  viewers: Types.ObjectId[];
  reactions: StoryReaction[];
  expiresAt: Date;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const reactionSchema = new Schema<StoryReaction>(
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

const storySchema = new Schema<StoryDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    content: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ""
    },
    media: {
      type: [String],
      default: []
    },
    viewers: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: []
    },
    reactions: {
      type: [reactionSchema],
      default: []
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000)
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

storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
storySchema.index({ user: 1, deletedAt: 1, expiresAt: 1 });

export const Story = model<StoryDocument>("Story", storySchema);
