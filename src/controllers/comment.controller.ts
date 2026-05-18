import { Request, Response } from "express";
import { Types } from "mongoose";
import { Comment, CommentDocument } from "../models/comment.model";
import { Post } from "../models/post.model";
import { AppError } from "../utils/AppError";
import { getPagination } from "../utils/pagination";

const checkId = (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid id", 400);
  }
};

const readText = (value: unknown) => {
  return typeof value === "string" ? value.trim() : "";
};

const hasField = (body: any, field: string) => {
  return Object.prototype.hasOwnProperty.call(body ?? {}, field);
};

const readStringArray = (value: unknown, field: string) => {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new AppError(`${field} must be an array`, 400);
  }

  return value.map((item) => {
    if (typeof item !== "string" || !item.trim()) {
      throw new AppError(`Every ${field} item must be a text value`, 400);
    }

    return item.trim();
  });
};

const readObjectIdArray = (value: unknown, field: string) => {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new AppError(`${field} must be an array`, 400);
  }

  return value.map((item) => {
    if (typeof item !== "string" || !Types.ObjectId.isValid(item)) {
      throw new AppError(`Every ${field} item must be a valid id`, 400);
    }

    return new Types.ObjectId(item);
  });
};

const readCommentData = (body: any, partial = false) => {
  const data: {
    content?: string;
    folderId?: string;
    attachments?: string[];
    tags?: Types.ObjectId[];
  } = {};
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  const attachments =
    !partial || hasField(body, "attachments") ? readStringArray(body?.attachments, "attachments") : undefined;

  if (!partial && !content && !attachments?.length) {
    throw new AppError("Content or attachments are required", 400);
  }

  if (content.length > 1000) {
    throw new AppError("Content must be less than 1000 characters", 400);
  }

  if (!partial || hasField(body, "content")) {
    if (!content && (!attachments || !attachments.length)) {
      throw new AppError("Content or attachments are required", 400);
    }

    data.content = content || undefined;
  }

  if (attachments !== undefined) {
    data.attachments = attachments;
  }

  if (!partial || hasField(body, "folderId")) {
    const folderId = readText(body?.folderId);
    data.folderId = folderId || undefined;
  }

  if (!partial || hasField(body, "tags")) {
    data.tags = readObjectIdArray(body?.tags, "tags");
  }

  if (partial && !Object.keys(data).length) {
    throw new AppError("No data to update", 400);
  }

  return data;
};

const checkCommentOwner = (comment: CommentDocument, requestUserId: Types.ObjectId, role: string) => {
  if (role === "admin") {
    return;
  }

  if (comment.createdBy.toString() !== requestUserId.toString()) {
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

const userSelect = "name email avatar";

const replyPopulate = [
  {
    path: "createdBy",
    select: userSelect
  },
  {
    path: "likes",
    select: userSelect
  },
  {
    path: "tags",
    select: userSelect
  }
];

const repliesPopulate = {
  path: "replies",
  match: { deletedAt: null, commentOnModel: "Comment" },
  options: { sort: { createdAt: -1 } },
  populate: replyPopulate
};

const commentPopulate = [
  {
    path: "createdBy",
    select: userSelect
  },
  {
    path: "postId",
    select: "content images user"
  },
  {
    path: "commentOn",
    select: "content images user createdBy"
  },
  {
    path: "likes",
    select: userSelect
  },
  {
    path: "tags",
    select: userSelect
  },
  repliesPopulate
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
    postId: post._id,
    commentOn: post._id,
    commentOnModel: "Post",
    createdBy: req.user._id,
    ...readCommentData(req.body)
  });

  await comment.populate(commentPopulate);

  res.status(201).json({
    success: true,
    message: "Comment created",
    comment
  });
};

export const createReply = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not found", 401);
  }

  const parentComment = await getCommentById(req.params.id);

  if (parentComment.commentOnModel === "Comment") {
    throw new AppError("Replies can be added to top-level comments only", 400);
  }

  const post = await Post.findOne({ _id: parentComment.postId, deletedAt: null });

  if (!post) {
    throw new AppError("Post not found", 404);
  }

  const reply = await Comment.create({
    postId: parentComment.postId,
    commentOn: parentComment._id,
    commentOnModel: "Comment",
    createdBy: req.user._id,
    ...readCommentData(req.body)
  });

  await reply.populate(commentPopulate);

  res.status(201).json({
    success: true,
    message: "Reply created",
    reply
  });
};

export const getPostComments = async (req: Request, res: Response) => {
  checkId(req.params.postId);

  const { page, limit, skip } = getPagination(req.query);
  const filter = {
    postId: req.params.postId,
    deletedAt: null,
    $or: [
      { commentOn: req.params.postId, commentOnModel: "Post" },
      { commentOnModel: { $exists: false } },
      { commentOnModel: null }
    ]
  };

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

export const getCommentReplies = async (req: Request, res: Response) => {
  const parentComment = await getCommentById(req.params.id);
  const { page, limit, skip } = getPagination(req.query);
  const filter = {
    commentOn: parentComment._id,
    commentOnModel: "Comment",
    deletedAt: null
  };

  const [replies, total] = await Promise.all([
    Comment.find(filter).populate(commentPopulate).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Comment.countDocuments(filter)
  ]);

  res.json({
    success: true,
    page,
    limit,
    total,
    replies
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

  Object.assign(comment, readCommentData(req.body, true));
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
  const deletedAt = comment.deletedAt;
  const post = await Post.findOne({ _id: comment.postId, deletedAt: null });

  if (!post) {
    throw new AppError("Post is deleted", 400);
  }

  if (comment.commentOnModel === "Comment") {
    const parentComment = await Comment.findOne({ _id: comment.commentOn, deletedAt: null });

    if (!parentComment) {
      throw new AppError("Parent comment is deleted", 400);
    }
  }

  checkCommentOwner(comment, req.user._id, req.user.role);

  comment.deletedAt = null;
  await comment.save();

  if (deletedAt) {
    await Comment.updateMany(
      { commentOn: comment._id, commentOnModel: "Comment", deletedAt },
      { deletedAt: null }
    );
  }

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
  const alreadyLiked = comment.likes.some((userId) => userId.toString() === req.user?._id.toString());

  if (!alreadyLiked) {
    comment.likes.push(req.user._id);
  }

  await comment.save();

  res.json({
    success: true,
    message: "Like saved",
    likes: comment.likes
  });
};

export const removeCommentReaction = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not found", 401);
  }

  const comment = await getCommentById(req.params.id);

  comment.likes = comment.likes.filter((userId) => userId.toString() !== req.user?._id.toString());
  await comment.save();

  res.json({
    success: true,
    message: "Like removed",
    likes: comment.likes
  });
};
