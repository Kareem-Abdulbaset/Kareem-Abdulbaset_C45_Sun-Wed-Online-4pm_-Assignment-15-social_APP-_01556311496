import { Request, Response } from "express";
import { Types } from "mongoose";
import { Story, StoryDocument } from "../models/story.model";
import { AppError } from "../utils/AppError";
import { getPagination } from "../utils/pagination";
import { readReactionType } from "../utils/reaction";

const checkId = (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid id", 400);
  }
};

const readMedia = (value: unknown) => {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new AppError("Media must be an array", 400);
  }

  return value.map((media) => {
    if (typeof media !== "string" || !media.trim()) {
      throw new AppError("Every media item must be a text url", 400);
    }

    return media.trim();
  });
};

const readStoryBody = (body: any) => {
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  const media = readMedia(body?.media);

  if (!content && !media.length) {
    throw new AppError("Content or media is required", 400);
  }

  if (content.length > 500) {
    throw new AppError("Content must be less than 500 characters", 400);
  }

  return {
    content,
    media
  };
};

const checkStoryOwner = (story: StoryDocument, requestUserId: Types.ObjectId, role: string) => {
  if (role === "admin") {
    return;
  }

  if (story.user.toString() !== requestUserId.toString()) {
    throw new AppError("You are not allowed", 403);
  }
};

const storyPopulate = [
  {
    path: "user",
    select: "name email avatar"
  },
  {
    path: "viewers",
    select: "name email avatar"
  },
  {
    path: "reactions.user",
    select: "name email avatar"
  }
];

const getStoryById = async (id: string, includeDeleted = false, includeExpired = false) => {
  checkId(id);

  const query: any = { _id: id };

  if (!includeDeleted) {
    query.deletedAt = null;
  }

  if (!includeExpired) {
    query.expiresAt = { $gt: new Date() };
  }

  const story = await Story.findOne(query);

  if (!story) {
    throw new AppError("Story not found", 404);
  }

  return story;
};

export const createStory = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not found", 401);
  }

  const data = readStoryBody(req.body);
  const story = await Story.create({
    user: req.user._id,
    content: data.content,
    media: data.media
  });

  await story.populate(storyPopulate);

  res.status(201).json({
    success: true,
    message: "Story created",
    story
  });
};

export const getActiveStories = async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { deletedAt: null, expiresAt: { $gt: new Date() } };

  const [stories, total] = await Promise.all([
    Story.find(filter).populate(storyPopulate).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Story.countDocuments(filter)
  ]);

  res.json({
    success: true,
    page,
    limit,
    total,
    stories
  });
};

export const getMyStories = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not found", 401);
  }

  const stories = await Story.find({
    user: req.user._id,
    deletedAt: null,
    expiresAt: { $gt: new Date() }
  }).populate(storyPopulate).sort({ createdAt: -1 });

  res.json({
    success: true,
    stories
  });
};

export const getStory = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not found", 401);
  }

  const includeDeleted = req.user.role === "admin";
  const includeExpired = req.user.role === "admin";
  const story = await getStoryById(req.params.id, includeDeleted, includeExpired);

  if (story.user.toString() !== req.user._id.toString()) {
    const viewed = story.viewers.some((viewer) => viewer.toString() === req.user?._id.toString());

    if (!viewed) {
      story.viewers.push(req.user._id);
      await story.save();
    }
  }

  await story.populate(storyPopulate);

  res.json({
    success: true,
    story
  });
};

export const updateStory = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not found", 401);
  }

  const story = await getStoryById(req.params.id, true, true);

  if (story.deletedAt) {
    throw new AppError("Story is deleted", 400);
  }

  checkStoryOwner(story, req.user._id, req.user.role);

  const data = readStoryBody(req.body);
  story.content = data.content;
  story.media = data.media;
  await story.save();
  await story.populate(storyPopulate);

  res.json({
    success: true,
    message: "Story updated",
    story
  });
};

export const softDeleteStory = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not found", 401);
  }

  const story = await getStoryById(req.params.id, true, true);

  checkStoryOwner(story, req.user._id, req.user.role);

  if (!story.deletedAt) {
    story.deletedAt = new Date();
    await story.save();
  }

  res.json({
    success: true,
    message: "Story deleted"
  });
};

export const restoreStory = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not found", 401);
  }

  const story = await getStoryById(req.params.id, true, true);

  checkStoryOwner(story, req.user._id, req.user.role);

  story.deletedAt = null;
  await story.save();
  await story.populate(storyPopulate);

  res.json({
    success: true,
    message: "Story restored",
    story
  });
};

export const hardDeleteStory = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not found", 401);
  }

  const story = await getStoryById(req.params.id, true, true);

  checkStoryOwner(story, req.user._id, req.user.role);
  await story.deleteOne();

  res.json({
    success: true,
    message: "Story hard deleted"
  });
};

export const setStoryReaction = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not found", 401);
  }

  const story = await getStoryById(req.params.id);
  const type = readReactionType(req.body?.type);
  const reaction = story.reactions.find((item) => item.user.toString() === req.user?._id.toString());

  if (reaction) {
    reaction.type = type;
  } else {
    story.reactions.push({
      user: req.user._id,
      type,
      createdAt: new Date()
    });
  }

  await story.save();

  res.json({
    success: true,
    message: "Reaction saved",
    reactions: story.reactions
  });
};

export const removeStoryReaction = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("User not found", 401);
  }

  const story = await getStoryById(req.params.id);

  story.reactions = story.reactions.filter((item) => item.user.toString() !== req.user?._id.toString());
  await story.save();

  res.json({
    success: true,
    message: "Reaction removed",
    reactions: story.reactions
  });
};
