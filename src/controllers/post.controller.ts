import { Request, Response } from "express";
import { Types } from "mongoose";
import { Post } from "../models/post.model";
import { AppError } from "../utils/AppError";
import { createPostSchema, updatePostSchema } from "../validations/post.validation";

const checkId = (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid id", 400);
  }
};

const checkPostOwner = (postUserId: Types.ObjectId, requestUserId: Types.ObjectId, role: string) => {
  if (role === "admin") {
    return;
  }

  if (postUserId.toString() !== requestUserId.toString()) {
    throw new AppError("You are not allowed", 403);
  }
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

  await post.populate("user", "name email");

  res.status(201).json({
    success: true,
    message: "Post created",
    post
  });
};

export const getAllPosts = async (req: Request, res: Response) => {
  const posts = await Post.find().populate("user", "name email").sort({ createdAt: -1 });

  res.json({
    success: true,
    posts
  });
};

export const getPost = async (req: Request, res: Response) => {
  checkId(req.params.id);

  const post = await Post.findById(req.params.id).populate("user", "name email");

  if (!post) {
    throw new AppError("Post not found", 404);
  }

  res.json({
    success: true,
    post
  });
};

export const updatePost = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not found", 401);
  }

  checkId(req.params.id);

  const post = await Post.findById(req.params.id);

  if (!post) {
    throw new AppError("Post not found", 404);
  }

  checkPostOwner(post.user, req.user._id, req.user.role);

  const data = updatePostSchema(req.body);

  if (data.content !== undefined) {
    post.content = data.content;
  }

  if (data.images !== undefined) {
    post.images = data.images;
  }

  await post.save();
  await post.populate("user", "name email");

  res.json({
    success: true,
    message: "Post updated",
    post
  });
};

export const deletePost = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not found", 401);
  }

  checkId(req.params.id);

  const post = await Post.findById(req.params.id);

  if (!post) {
    throw new AppError("Post not found", 404);
  }

  checkPostOwner(post.user, req.user._id, req.user.role);

  await post.deleteOne();

  res.json({
    success: true,
    message: "Post deleted"
  });
};
