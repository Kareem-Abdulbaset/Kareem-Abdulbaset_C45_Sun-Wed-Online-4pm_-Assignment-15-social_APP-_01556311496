import { Injectable } from "@nestjs/common";
import { Types } from "mongoose";
import { Comment } from "../../models/comment.model";
import { Post, PostDocument } from "../../models/post.model";
import { User } from "../../models/user.model";
import { AppError } from "../../utils/AppError";
import { getPagination } from "../../utils/pagination";
import { readReactionType } from "../../utils/reaction";

@Injectable()
export class PostsService {
  private checkId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid id", 400);
    }
  }

  private checkPostOwner(post: PostDocument, requestUserId: Types.ObjectId, role: string) {
    if (role === "admin") {
      return;
    }

    if (post.user.toString() !== requestUserId.toString()) {
      throw new AppError("You are not allowed", 403);
    }
  }

  private async getPostById(id: string, includeDeleted = false) {
    this.checkId(id);

    const query = includeDeleted ? { _id: id } : { _id: id, deletedAt: null };
    const post = await Post.findOne(query);

    if (!post) {
      throw new AppError("Post not found", 404);
    }

    return post;
  }

  private postPopulate = [
    {
      path: "user",
      select: "name email avatar coverImage bio"
    },
    {
      path: "reactions.user",
      select: "name email avatar"
    }
  ];

  private commentUserSelect = "name email avatar";

  private postCommentReplyPopulate = [
    {
      path: "createdBy",
      select: this.commentUserSelect
    },
    {
      path: "likes",
      select: this.commentUserSelect
    },
    {
      path: "tags",
      select: this.commentUserSelect
    }
  ];

  private postCommentsPopulate = {
    path: "comments",
    match: { deletedAt: null, commentOnModel: "Post" },
    options: { sort: { createdAt: -1 } },
    populate: [
      ...this.postCommentReplyPopulate,
      {
        path: "replies",
        match: { deletedAt: null, commentOnModel: "Comment" },
        options: { sort: { createdAt: -1 } },
        populate: this.postCommentReplyPopulate
      }
    ]
  };

  async createPost(userId: Types.ObjectId, body: { content: string; images?: string[] }) {
    const post = await Post.create({
      user: userId,
      content: body.content,
      images: body.images || []
    });

    await post.populate(this.postPopulate);

    return {
      success: true,
      message: "Post created",
      post
    };
  }

  async getAllPosts(query: any, isAdmin: boolean) {
    const { page, limit, skip } = getPagination(query);
    const includeDeleted = isAdmin && query.includeDeleted === "true";
    const filter = includeDeleted ? {} : { deletedAt: null };

    const [posts, total] = await Promise.all([
      Post.find(filter).populate(this.postPopulate).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Post.countDocuments(filter)
    ]);

    return {
      success: true,
      page,
      limit,
      total,
      posts
    };
  }

  async getNewsFeed(query: any) {
    const { page, limit, skip } = getPagination(query);
    const filter = { deletedAt: null };

    const [posts, total] = await Promise.all([
      Post.find(filter).populate(this.postPopulate).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Post.countDocuments(filter)
    ]);

    return {
      success: true,
      page,
      limit,
      total,
      posts
    };
  }

  async getProfilePosts(userId: string, query: any) {
    this.checkId(userId);

    const { page, limit, skip } = getPagination(query);
    const user = await User.findOne({ _id: userId, deletedAt: null });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const filter = { user: user._id, deletedAt: null };
    const [posts, total] = await Promise.all([
      Post.find(filter).populate(this.postPopulate).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Post.countDocuments(filter)
    ]);

    return {
      success: true,
      page,
      limit,
      total,
      user,
      posts
    };
  }

  async getPost(id: string, isAdmin: boolean) {
    const post = await this.getPostById(id, isAdmin);
    const commentsCount = await Comment.countDocuments({ postId: post._id, deletedAt: null });
    const repliesCount = await Comment.countDocuments({
      postId: post._id,
      commentOnModel: "Comment",
      deletedAt: null
    });

    await post.populate([...this.postPopulate, this.postCommentsPopulate]);

    return {
      success: true,
      commentsCount,
      repliesCount,
      post
    };
  }

  async updatePost(id: string, userId: Types.ObjectId, role: string, body: any) {
    const post = await this.getPostById(id, true);

    if (post.deletedAt) {
      throw new AppError("Post is deleted", 400);
    }

    this.checkPostOwner(post, userId, role);

    if (body.content !== undefined) {
      post.content = body.content;
    }

    if (body.images !== undefined) {
      post.images = body.images;
    }

    await post.save();
    await post.populate(this.postPopulate);

    return {
      success: true,
      message: "Post updated",
      post
    };
  }

  async softDeletePost(id: string, userId: Types.ObjectId, role: string) {
    const post = await this.getPostById(id, true);

    this.checkPostOwner(post, userId, role);

    if (!post.deletedAt) {
      post.deletedAt = new Date();
      await post.save();
    }

    return {
      success: true,
      message: "Post deleted"
    };
  }

  async restorePost(id: string, userId: Types.ObjectId, role: string) {
    const post = await this.getPostById(id, true);
    const deletedAt = post.deletedAt;

    this.checkPostOwner(post, userId, role);

    post.deletedAt = null;
    await post.save();

    if (deletedAt) {
      await Comment.updateMany({ postId: post._id, deletedAt }, { deletedAt: null });
    }

    await post.populate(this.postPopulate);

    return {
      success: true,
      message: "Post restored",
      post
    };
  }

  async hardDeletePost(id: string, userId: Types.ObjectId, role: string) {
    const post = await this.getPostById(id, true);

    this.checkPostOwner(post, userId, role);
    await post.deleteOne();

    return {
      success: true,
      message: "Post hard deleted"
    };
  }

  async setPostReaction(id: string, userId: Types.ObjectId) {
    const post = await this.getPostById(id);
    const type = readReactionType("like");
    const reaction = post.reactions.find((item) => item.user.toString() === userId.toString());

    if (reaction) {
      reaction.type = type;
    } else {
      post.reactions.push({
        user: userId,
        type,
        createdAt: new Date()
      });
    }

    await post.save();

    return {
      success: true,
      message: "Reaction saved",
      reactions: post.reactions
    };
  }

  async setPostReactionWithType(id: string, userId: Types.ObjectId, body: any) {
    const post = await this.getPostById(id);
    const type = readReactionType(body?.type ?? "like");
    const reaction = post.reactions.find((item) => item.user.toString() === userId.toString());

    if (reaction) {
      reaction.type = type;
    } else {
      post.reactions.push({
        user: userId,
        type,
        createdAt: new Date()
      });
    }

    await post.save();

    return {
      success: true,
      message: "Reaction saved",
      reactions: post.reactions
    };
  }

  async removePostReaction(id: string, userId: Types.ObjectId) {
    const post = await this.getPostById(id);

    post.reactions = post.reactions.filter((item) => item.user.toString() !== userId.toString());
    await post.save();

    return {
      success: true,
      message: "Reaction removed",
      reactions: post.reactions
    };
  }
}
