import { Request, Response } from "express";
import { Types } from "mongoose";
import { Comment } from "../models/comment.model";
import { Post, PostDocument } from "../models/post.model";
import { User } from "../models/user.model";
import { AppError } from "../utils/AppError";
import { getPagination } from "../utils/pagination";
import { readReactionType } from "../utils/reaction";
import { createPostSchema, updatePostSchema } from "../validations/post.validation";

const checkId = (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid id", 400);
  }
};

const checkPostOwner = (post: PostDocument, requestUserId: Types.ObjectId, role: string) => {
  if (role === "admin") {
    return;
  }

  if (post.user.toString() !== requestUserId.toString()) {
    throw new AppError("You are not allowed", 403);
  }
};

const getPostById = async (id: string, includeDeleted = false) => {
  checkId(id);

  const query = includeDeleted ? { _id: id } : { _id: id, deletedAt: null };
  const post = await Post.findOne(query);

  if (!post) {
    throw new AppError("Post not found", 404);
  }

  return post;
};

const postPopulate = [
  {
    path: "user",
    select: "name email avatar coverImage bio"
  },
  {
    path: "reactions.user",
    select: "name email avatar"
  }
];

const commentUserSelect = "name email avatar";

const postCommentReplyPopulate = [
  {
    path: "createdBy",
    select: commentUserSelect
  },
  {
    path: "likes",
    select: commentUserSelect
  },
  {
    path: "tags",
    select: commentUserSelect
  }
];

const postCommentsPopulate = {
  path: "comments",
  match: { deletedAt: null, commentOnModel: "Post" },
  options: { sort: { createdAt: -1 } },
  populate: [
    ...postCommentReplyPopulate,
    {
      path: "replies",
      match: { deletedAt: null, commentOnModel: "Comment" },
      options: { sort: { createdAt: -1 } },
      populate: postCommentReplyPopulate
    }
  ]
};

export const createPost = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not found", 401);
  }

  const data = createPostSchema(req.body);

  const post = await Post.create({
    user: req.user._id,
    content: data.content,
    images: data.images
  });

  await post.populate(postPopulate);

  res.status(201).json({
    success: true,
    message: "Post created",
    post
  });
};

export const getAllPosts = async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req.query);
  const includeDeleted = req.user?.role === "admin" && req.query.includeDeleted === "true";
  const filter = includeDeleted ? {} : { deletedAt: null };

  const [posts, total] = await Promise.all([
    Post.find(filter).populate(postPopulate).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Post.countDocuments(filter)
  ]);

  res.json({
    success: true,
    page,
    limit,
    total,
    posts
  });
};

export const getNewsFeed = async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { deletedAt: null };

  const [posts, total] = await Promise.all([
    Post.find(filter).populate(postPopulate).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Post.countDocuments(filter)
  ]);

  res.json({
    success: true,
    page,
    limit,
    total,
    posts
  });
};

export const getProfilePosts = async (req: Request, res: Response) => {
  checkId(req.params.userId);

  const { page, limit, skip } = getPagination(req.query);
  const user = await User.findOne({ _id: req.params.userId, deletedAt: null });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const filter = { user: user._id, deletedAt: null };
  const [posts, total] = await Promise.all([
    Post.find(filter).populate(postPopulate).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Post.countDocuments(filter)
  ]);

  res.json({
    success: true,
    page,
    limit,
    total,
    user,
    posts
  });
};

export const getPost = async (req: Request, res: Response) => {
  const includeDeleted = req.user?.role === "admin";
  const post = await getPostById(req.params.id, includeDeleted);
  const commentsCount = await Comment.countDocuments({ postId: post._id, deletedAt: null });
  const repliesCount = await Comment.countDocuments({
    postId: post._id,
    commentOnModel: "Comment",
    deletedAt: null
  });

  await post.populate([...postPopulate, postCommentsPopulate]);

  res.json({
    success: true,
    commentsCount,
    repliesCount,
    post
  });
};

export const updatePost = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not found", 401);
  }

  const post = await getPostById(req.params.id, true);

  if (post.deletedAt) {
    throw new AppError("Post is deleted", 400);
  }

  checkPostOwner(post, req.user._id, req.user.role);

  const data = updatePostSchema(req.body);

  if (data.content !== undefined) {
    post.content = data.content;
  }

  if (data.images !== undefined) {
    post.images = data.images;
  }

  await post.save();
  await post.populate(postPopulate);

  res.json({
    success: true,
    message: "Post updated",
    post
  });
};

export const softDeletePost = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not found", 401);
  }

  const post = await getPostById(req.params.id, true);

  checkPostOwner(post, req.user._id, req.user.role);

  if (!post.deletedAt) {
    post.deletedAt = new Date();
    await post.save();
  }

  res.json({
    success: true,
    message: "Post deleted"
  });
};

export const restorePost = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not found", 401);
  }

  const post = await getPostById(req.params.id, true);
  const deletedAt = post.deletedAt;

  checkPostOwner(post, req.user._id, req.user.role);

  post.deletedAt = null;
  await post.save();

  if (deletedAt) {
    await Comment.updateMany({ postId: post._id, deletedAt }, { deletedAt: null });
  }

  await post.populate(postPopulate);

  res.json({
    success: true,
    message: "Post restored",
    post
  });
};

export const hardDeletePost = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not found", 401);
  }

  const post = await getPostById(req.params.id, true);

  checkPostOwner(post, req.user._id, req.user.role);
  await post.deleteOne();

  res.json({
    success: true,
    message: "Post hard deleted"
  });
};

export const setPostReaction = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not found", 401);
  }

  const post = await getPostById(req.params.id);
  const type = readReactionType(req.body?.type ?? "like");
  const reaction = post.reactions.find((item) => item.user.toString() === req.user?._id.toString());

  if (reaction) {
    reaction.type = type;
  } else {
    post.reactions.push({
      user: req.user._id,
      type,
      createdAt: new Date()
    });
  }

  await post.save();

  res.json({
    success: true,
    message: "Reaction saved",
    reactions: post.reactions
  });
};

export const removePostReaction = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not found", 401);
  }

  const post = await getPostById(req.params.id);

  post.reactions = post.reactions.filter((item) => item.user.toString() !== req.user?._id.toString());
  await post.save();

  res.json({
    success: true,
    message: "Reaction removed",
    reactions: post.reactions
  });
};
