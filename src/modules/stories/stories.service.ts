import { Injectable } from "@nestjs/common";
import { Types } from "mongoose";
import { Story, StoryDocument } from "../../models/story.model";
import { AppError } from "../../utils/AppError";
import { getPagination } from "../../utils/pagination";
import { readReactionType } from "../../utils/reaction";

@Injectable()
export class StoriesService {
  private checkId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid id", 400);
    }
  }

  private readMedia(value: unknown) {
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
  }

  private readStoryBody(body: any) {
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    const media = this.readMedia(body?.media);

    if (!content && !media.length) {
      throw new AppError("Content or media is required", 400);
    }

    if (content.length > 500) {
      throw new AppError("Content must be less than 500 characters", 400);
    }

    return { content, media };
  }

  private checkStoryOwner(story: StoryDocument, requestUserId: Types.ObjectId, role: string) {
    if (role === "admin") {
      return;
    }

    if (story.user.toString() !== requestUserId.toString()) {
      throw new AppError("You are not allowed", 403);
    }
  }

  private storyPopulate = [
    { path: "user", select: "name email avatar" },
    { path: "viewers", select: "name email avatar" },
    { path: "reactions.user", select: "name email avatar" }
  ];

  private async getStoryById(id: string, includeDeleted = false, includeExpired = false) {
    this.checkId(id);

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
  }

  async createStory(userId: Types.ObjectId, body: any) {
    const data = this.readStoryBody(body);
    const story = await Story.create({
      user: userId,
      content: data.content,
      media: data.media
    });

    await story.populate(this.storyPopulate);

    return {
      success: true,
      message: "Story created",
      story
    };
  }

  async getActiveStories(query: any) {
    const { page, limit, skip } = getPagination(query);
    const filter = { deletedAt: null, expiresAt: { $gt: new Date() } };

    const [stories, total] = await Promise.all([
      Story.find(filter).populate(this.storyPopulate).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Story.countDocuments(filter)
    ]);

    return {
      success: true,
      page,
      limit,
      total,
      stories
    };
  }

  async getMyStories(userId: Types.ObjectId) {
    const stories = await Story.find({
      user: userId,
      deletedAt: null,
      expiresAt: { $gt: new Date() }
    }).populate(this.storyPopulate).sort({ createdAt: -1 });

    return {
      success: true,
      stories
    };
  }

  async getStory(id: string, userId: Types.ObjectId, role: string) {
    const includeDeleted = role === "admin";
    const includeExpired = role === "admin";
    const story = await this.getStoryById(id, includeDeleted, includeExpired);

    if (story.user.toString() !== userId.toString()) {
      const viewed = story.viewers.some((viewer) => viewer.toString() === userId.toString());

      if (!viewed) {
        story.viewers.push(userId);
        await story.save();
      }
    }

    await story.populate(this.storyPopulate);

    return {
      success: true,
      story
    };
  }

  async updateStory(id: string, userId: Types.ObjectId, role: string, body: any) {
    const story = await this.getStoryById(id, true, true);

    if (story.deletedAt) {
      throw new AppError("Story is deleted", 400);
    }

    this.checkStoryOwner(story, userId, role);

    const data = this.readStoryBody(body);
    story.content = data.content;
    story.media = data.media;
    await story.save();
    await story.populate(this.storyPopulate);

    return {
      success: true,
      message: "Story updated",
      story
    };
  }

  async softDeleteStory(id: string, userId: Types.ObjectId, role: string) {
    const story = await this.getStoryById(id, true, true);

    this.checkStoryOwner(story, userId, role);

    if (!story.deletedAt) {
      story.deletedAt = new Date();
      await story.save();
    }

    return {
      success: true,
      message: "Story deleted"
    };
  }

  async restoreStory(id: string, userId: Types.ObjectId, role: string) {
    const story = await this.getStoryById(id, true, true);

    this.checkStoryOwner(story, userId, role);

    story.deletedAt = null;
    await story.save();
    await story.populate(this.storyPopulate);

    return {
      success: true,
      message: "Story restored",
      story
    };
  }

  async hardDeleteStory(id: string, userId: Types.ObjectId, role: string) {
    const story = await this.getStoryById(id, true, true);

    this.checkStoryOwner(story, userId, role);
    await story.deleteOne();

    return {
      success: true,
      message: "Story hard deleted"
    };
  }

  async setStoryReaction(id: string, userId: Types.ObjectId, body: any) {
    const story = await this.getStoryById(id);
    const type = readReactionType(body?.type);
    const reaction = story.reactions.find((item) => item.user.toString() === userId.toString());

    if (reaction) {
      reaction.type = type;
    } else {
      story.reactions.push({
        user: userId,
        type,
        createdAt: new Date()
      });
    }

    await story.save();

    return {
      success: true,
      message: "Reaction saved",
      reactions: story.reactions
    };
  }

  async removeStoryReaction(id: string, userId: Types.ObjectId) {
    const story = await this.getStoryById(id);

    story.reactions = story.reactions.filter((item) => item.user.toString() !== userId.toString());
    await story.save();

    return {
      success: true,
      message: "Reaction removed",
      reactions: story.reactions
    };
  }
}
