import { Document, Schema, Types, model } from "mongoose";

export interface PostDocument extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  content: string;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

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
    }
  },
  {
    timestamps: true
  }
);

export const Post = model<PostDocument>("Post", postSchema);
