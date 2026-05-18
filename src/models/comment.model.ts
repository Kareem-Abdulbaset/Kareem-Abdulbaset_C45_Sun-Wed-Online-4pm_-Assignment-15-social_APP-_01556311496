import { Document, Model, Schema, Types, model } from "mongoose";

export type CommentOnModel = "Post" | "Comment";

export interface CommentDocument extends Document {
  _id: Types.ObjectId;
  content?: string;
  folderId?: string;
  attachments: string[];
  likes: Types.ObjectId[];
  tags: Types.ObjectId[];
  postId: Types.ObjectId;
  commentOn: Types.ObjectId;
  commentOnModel: CommentOnModel;
  createdBy: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<CommentDocument>(
  {
    content: {
      type: String,
      trim: true,
      minlength: 1,
      maxlength: 1000,
      required: function (this: CommentDocument) {
        return !this.attachments?.length;
      }
    },
    folderId: { type: String, trim: true },
    attachments: { type: [String], default: [] },
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    tags: [{ type: Schema.Types.ObjectId, ref: "User" }],
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    commentOn: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "commentOnModel"
    },
    commentOnModel: {
      type: String,
      enum: ["Post", "Comment"],
      required: true
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    deletedAt: { type: Date, default: null }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

commentSchema.index({ postId: 1, deletedAt: 1, createdAt: -1 });
commentSchema.index({ commentOn: 1, commentOnModel: 1, deletedAt: 1, createdAt: -1 });
commentSchema.index({ createdBy: 1, deletedAt: 1, createdAt: -1 });

commentSchema.virtual("replies", {
  ref: "Comment",
  localField: "_id",
  foreignField: "commentOn"
});

commentSchema.pre("validate", function () {
  if (!this.commentOn) {
    this.commentOn = this.postId;
  }

  if (!this.commentOnModel) {
    this.commentOnModel = "Post";
  }
});

commentSchema.pre("save", async function () {
  if (!this.isModified("deletedAt") || !this.deletedAt) {
    return;
  }

  const CommentModel = this.constructor as Model<CommentDocument>;

  await CommentModel.updateMany(
    { commentOn: this._id, commentOnModel: "Comment", deletedAt: null },
    { deletedAt: this.deletedAt }
  );
});

commentSchema.pre("deleteOne", { document: true, query: false }, async function () {
  const CommentModel = this.constructor as Model<CommentDocument>;

  await CommentModel.deleteMany({ commentOn: this._id, commentOnModel: "Comment" });
});

export const Comment = model<CommentDocument>("Comment", commentSchema);
