import { Document, Schema, Types, model } from "mongoose";
import { ReactionType, reactionTypes } from "../utils/reaction";

export interface PostReaction {
  user: Types.ObjectId;
  type: ReactionType;
  createdAt: Date;
}

export interface PostDocument extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  content: string;
  images: string[];
  reactions: PostReaction[];
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const reactionSchema = new Schema<PostReaction>(
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

const postSchema = new Schema<PostDocument>(
  {
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
      maxlength: 2000
    },
    images: {
      type: [String],
      default: []
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
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

postSchema.index({ deletedAt: 1, createdAt: -1 });
postSchema.index({ user: 1, deletedAt: 1, createdAt: -1 });

postSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "commentOn"
});

postSchema.pre("save", async function () {
  if (!this.isModified("deletedAt") || !this.deletedAt) {
    return;
  }

  const { Comment } = await import("./comment.model");

  await Comment.updateMany({ postId: this._id, deletedAt: null }, { deletedAt: this.deletedAt });
});

postSchema.pre("deleteOne", { document: true, query: false }, async function () {
  const { Comment } = await import("./comment.model");

  await Comment.deleteMany({ postId: this._id });
});

export const Post = model<PostDocument>("Post", postSchema);
