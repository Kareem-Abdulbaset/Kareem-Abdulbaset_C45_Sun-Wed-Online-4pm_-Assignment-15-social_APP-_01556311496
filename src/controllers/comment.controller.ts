import { Request, Response } from "express";
import { Types } from "mongoose";
import { Comment, CommentDocument } from "../models/comment.model";
import { Post } from "../models/post.model";
import { AppError } from "../utils/AppError";
import { getPagination } from "../utils/pagination";
import { readReactionType } from "../utils/reaction";

const checkId = (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid id", 400);
  }
};

const readContent = (body: any) => {
  const content = typeof body?.content === "string" ? body.content.trim() : "";

  if (!content) {
    throw new AppError("Content is required", 400);
  }

  if (content.length > 1000) {
    throw new AppError("Content must be less than 1000 characters", 400);
  }

  return content;
};

const checkCommentOwner = (comment: CommentDocument, requestUserId: Types.ObjectId, role: string) => {
  if (role === "admin") {
    return;
  }

  if (comment.user.toString() !== requestUserId.toString()) {
    throw new AppError("You are not allowed", 403);
  }
};

const getCommentById = async (id: string, includeDeleted = false) => {
  checkId(id);

  const query = includeDeleted ? { _id: id } : { _id: id, deletedAt: null };
  const comment = await Comment.findOne(query);

  if (!comment) {
    throw new AppError("Comment not found", 404);
  }

  return comment;
};

const commentPopulate = [
  {
    path: "user",
    select: "name email avatar"
  },
  {
    path: "post",
    select: "content images user"
  },
  {
    path: "reactions.user",
    select: "name email avatar"
  }
];

export const createComment = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not found", 401);
  }

  checkId(req.params.postId);

  const post = await Post.findOne({ _id: req.params.postId, deletedAt: null });

  if (!post) {
    throw new AppError("Post not found", 404);
  }

  const comment = await Comment.create({
    post: post._id,
    user: req.user._id,
    content: readContent(req.body)
  });

  await comment.populate(commentPopulate);

  res.status(201).json({
    success: true,
    message: "Comment created",
    comment
  });
};

export const getPostComments = async (req: Request, res: Response) => {
  checkId(req.params.postId);

  const { page, limit, skip } = getPagination(req.query);
  const filter = { post: req.params.postId, deletedAt: null };

  const [comments, total] = await Promise.all([
    Comment.find(filter).populate(commentPopulate).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Comment.countDocuments(filter)
  ]);

  res.json({
    success: true,
    page,
    limit,
    total,
    comments
  });
};

export const getComment = async (req: Request, res: Response) => {
  const includeDeleted = req.user?.role === "admin";
  const comment = await getCommentById(req.params.id, includeDeleted);

  await comment.populate(commentPopulate);

  res.json({
    success: true,
    comment
  });
};

export const updateComment = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not found", 401);
  }

  const comment = await getCommentById(req.params.id, true);

  if (comment.deletedAt) {
    throw new AppError("Comment is deleted", 400);
  }

  checkCommentOwner(comment, req.user._id, req.user.role);

  comment.content = readContent(req.body);
  await comment.save();
  await comment.populate(commentPopulate);

  res.json({
    success: true,
    message: "Comment updated",
    comment
  });
};

export const softDeleteComment = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not found", 401);
  }

  const comment = await getCommentById(req.params.id, true);

  checkCommentOwner(comment, req.user._id, req.user.role);

  if (!comment.deletedAt) {
    comment.deletedAt = new Date();
    await comment.save();
  }

  res.json({
    success: true,
    message: "Comment deleted"
  });
};

export const restoreComment = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not found", 401);
  }

  const comment = await getCommentById(req.params.id, true);
  const post = await Post.findOne({ _id: comment.post, deletedAt: null });

  if (!post) {
    throw new AppError("Post is deleted", 400);
  }

  checkCommentOwner(comment, req.user._id, req.user.role);

  comment.deletedAt = null;
  await comment.save();
  await comment.populate(commentPopulate);

  res.json({
    success: true,
    message: "Comment restored",
    comment
  });
};

export const hardDeleteComment = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not found", 401);
  }

  const comment = await getCommentById(req.params.id, true);

  checkCommentOwner(comment, req.user._id, req.user.role);
  await comment.deleteOne();

  res.json({
    success: true,
    message: "Comment hard deleted"
  });
};

export const setCommentReaction = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not found", 401);
  }

  const comment = await getCommentById(req.params.id);
  const type = readReactionType(req.body?.type);
  const reaction = comment.reactions.find((item) => item.user.toString() === req.user?._id.toString());

  if (reaction) {
    reaction.type = type;
  } else {
    comment.reactions.push({
      user: req.user._id,
      type,
      createdAt: new Date()
    });
  }

  await comment.save();

  res.json({
    success: true,
    message: "Reaction saved",
    reactions: comment.reactions
  });
};

export const removeCommentReaction = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not found", 401);
  }

  const comment = await getCommentById(req.params.id);

  comment.reactions = comment.reactions.filter((item) => item.user.toString() !== req.user?._id.toString());
  await comment.save();

  res.json({
    success: true,
    message: "Reaction removed",
    reactions: comment.reactions
  });
};
