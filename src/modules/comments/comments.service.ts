import { Injectable } from "@nestjs/common";
import { Types } from "mongoose";
import { Comment, CommentDocument } from "../../models/comment.model";
import { Post } from "../../models/post.model";
import { AppError } from "../../utils/AppError";
import { getPagination } from "../../utils/pagination";

@Injectable()
export class CommentsService {
  private checkId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid id", 400);
    }
  }

  private readText(value: unknown) {
    return typeof value === "string" ? value.trim() : "";
  }

  private hasField(body: any, field: string) {
    return Object.prototype.hasOwnProperty.call(body ?? {}, field);
  }

  private readStringArray(value: unknown, field: string) {
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
  }

  private readObjectIdArray(value: unknown, field: string) {
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
  }

  private readCommentData(body: any, partial = false) {
    const data: {
      content?: string;
      folderId?: string;
      attachments?: string[];
      tags?: Types.ObjectId[];
    } = {};
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    const attachments =
      !partial || this.hasField(body, "attachments") ? this.readStringArray(body?.attachments, "attachments") : undefined;

    if (!partial && !content && !attachments?.length) {
      throw new AppError("Content or attachments are required", 400);
    }

    if (content.length > 1000) {
      throw new AppError("Content must be less than 1000 characters", 400);
    }

    if (!partial || this.hasField(body, "content")) {
      if (!content && (!attachments || !attachments.length)) {
        throw new AppError("Content or attachments are required", 400);
      }

      data.content = content || undefined;
    }

    if (attachments !== undefined) {
      data.attachments = attachments;
    }

    if (!partial || this.hasField(body, "folderId")) {
      const folderId = this.readText(body?.folderId);
      data.folderId = folderId || undefined;
    }

    if (!partial || this.hasField(body, "tags")) {
      data.tags = this.readObjectIdArray(body?.tags, "tags");
    }

    if (partial && !Object.keys(data).length) {
      throw new AppError("No data to update", 400);
    }

    return data;
  }

  private checkCommentOwner(comment: CommentDocument, requestUserId: Types.ObjectId, role: string) {
    if (role === "admin") {
      return;
    }

    if (comment.createdBy.toString() !== requestUserId.toString()) {
      throw new AppError("You are not allowed", 403);
    }
  }

  private async getCommentById(id: string, includeDeleted = false) {
    this.checkId(id);

    const query = includeDeleted ? { _id: id } : { _id: id, deletedAt: null };
    const comment = await Comment.findOne(query);

    if (!comment) {
      throw new AppError("Comment not found", 404);
    }

    return comment;
  }

  private userSelect = "name email avatar";

  private replyPopulate = [
    { path: "createdBy", select: this.userSelect },
    { path: "likes", select: this.userSelect },
    { path: "tags", select: this.userSelect }
  ];

  private repliesPopulate = {
    path: "replies",
    match: { deletedAt: null, commentOnModel: "Comment" },
    options: { sort: { createdAt: -1 } },
    populate: this.replyPopulate
  };

  private commentPopulate = [
    { path: "createdBy", select: this.userSelect },
    { path: "postId", select: "content images user" },
    { path: "commentOn", select: "content images user createdBy" },
    { path: "likes", select: this.userSelect },
    { path: "tags", select: this.userSelect },
    this.repliesPopulate
  ];

  async createComment(postId: string, userId: Types.ObjectId, body: any) {
    this.checkId(postId);

    const post = await Post.findOne({ _id: postId, deletedAt: null });

    if (!post) {
      throw new AppError("Post not found", 404);
    }

    const comment = await Comment.create({
      postId: post._id,
      commentOn: post._id,
      commentOnModel: "Post",
      createdBy: userId,
      ...this.readCommentData(body)
    });

    await comment.populate(this.commentPopulate);

    return {
      success: true,
      message: "Comment created",
      comment
    };
  }

  async createReply(commentId: string, userId: Types.ObjectId, body: any) {
    const parentComment = await this.getCommentById(commentId);

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
      createdBy: userId,
      ...this.readCommentData(body)
    });

    await reply.populate(this.commentPopulate);

    return {
      success: true,
      message: "Reply created",
      reply
    };
  }

  async getPostComments(postId: string, query: any) {
    this.checkId(postId);

    const { page, limit, skip } = getPagination(query);
    const filter = {
      postId,
      deletedAt: null,
      $or: [
        { commentOn: postId, commentOnModel: "Post" },
        { commentOnModel: { $exists: false } },
        { commentOnModel: null }
      ]
    };

    const [comments, total] = await Promise.all([
      Comment.find(filter).populate(this.commentPopulate).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Comment.countDocuments(filter)
    ]);

    return {
      success: true,
      page,
      limit,
      total,
      comments
    };
  }

  async getCommentReplies(commentId: string, query: any) {
    const parentComment = await this.getCommentById(commentId);
    const { page, limit, skip } = getPagination(query);
    const filter = {
      commentOn: parentComment._id,
      commentOnModel: "Comment",
      deletedAt: null
    };

    const [replies, total] = await Promise.all([
      Comment.find(filter).populate(this.commentPopulate).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Comment.countDocuments(filter)
    ]);

    return {
      success: true,
      page,
      limit,
      total,
      replies
    };
  }

  async getComment(id: string, isAdmin: boolean) {
    const comment = await this.getCommentById(id, isAdmin);

    await comment.populate(this.commentPopulate);

    return {
      success: true,
      comment
    };
  }

  async updateComment(id: string, userId: Types.ObjectId, role: string, body: any) {
    const comment = await this.getCommentById(id, true);

    if (comment.deletedAt) {
      throw new AppError("Comment is deleted", 400);
    }

    this.checkCommentOwner(comment, userId, role);

    Object.assign(comment, this.readCommentData(body, true));
    await comment.save();
    await comment.populate(this.commentPopulate);

    return {
      success: true,
      message: "Comment updated",
      comment
    };
  }

  async softDeleteComment(id: string, userId: Types.ObjectId, role: string) {
    const comment = await this.getCommentById(id, true);

    this.checkCommentOwner(comment, userId, role);

    if (!comment.deletedAt) {
      comment.deletedAt = new Date();
      await comment.save();
    }

    return {
      success: true,
      message: "Comment deleted"
    };
  }

  async restoreComment(id: string, userId: Types.ObjectId, role: string) {
    const comment = await this.getCommentById(id, true);
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

    this.checkCommentOwner(comment, userId, role);

    comment.deletedAt = null;
    await comment.save();

    if (deletedAt) {
      await Comment.updateMany(
        { commentOn: comment._id, commentOnModel: "Comment", deletedAt },
        { deletedAt: null }
      );
    }

    await comment.populate(this.commentPopulate);

    return {
      success: true,
      message: "Comment restored",
      comment
    };
  }

  async hardDeleteComment(id: string, userId: Types.ObjectId, role: string) {
    const comment = await this.getCommentById(id, true);

    this.checkCommentOwner(comment, userId, role);
    await comment.deleteOne();

    return {
      success: true,
      message: "Comment hard deleted"
    };
  }

  async setCommentReaction(id: string, userId: Types.ObjectId) {
    const comment = await this.getCommentById(id);
    const alreadyLiked = comment.likes.some((likeUserId) => likeUserId.toString() === userId.toString());

    if (!alreadyLiked) {
      comment.likes.push(userId);
    }

    await comment.save();

    return {
      success: true,
      message: "Like saved",
      likes: comment.likes
    };
  }

  async removeCommentReaction(id: string, userId: Types.ObjectId) {
    const comment = await this.getCommentById(id);

    comment.likes = comment.likes.filter((likeUserId) => likeUserId.toString() !== userId.toString());
    await comment.save();

    return {
      success: true,
      message: "Like removed",
      likes: comment.likes
    };
  }
}
