import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query
} from "@nestjs/common";
import { CommentsService } from "./comments.service";
import { Auth } from "../../common/decorators/auth.decorator";
import { User } from "../../common/decorators/current-user.decorator";
import { UserDocument } from "../../models/user.model";

@Controller("api/comments")
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Auth()
  @Post("post/:postId")
  async createComment(
    @Param("postId") postId: string,
    @User() user: UserDocument,
    @Body() body: any
  ) {
    return this.commentsService.createComment(postId, user._id, body);
  }

  @Auth()
  @Get("post/:postId")
  async getPostComments(@Param("postId") postId: string, @Query() query: any) {
    return this.commentsService.getPostComments(postId, query);
  }

  @Auth()
  @Post(":id/replies")
  async createReply(
    @Param("id") id: string,
    @User() user: UserDocument,
    @Body() body: any
  ) {
    return this.commentsService.createReply(id, user._id, body);
  }

  @Auth()
  @Get(":id/replies")
  async getCommentReplies(@Param("id") id: string, @Query() query: any) {
    return this.commentsService.getCommentReplies(id, query);
  }

  @Auth()
  @Get(":id")
  async getComment(@Param("id") id: string, @User() user: UserDocument) {
    return this.commentsService.getComment(id, user.role === "admin");
  }

  @Auth()
  @Patch(":id")
  async updateComment(
    @Param("id") id: string,
    @User() user: UserDocument,
    @Body() body: any
  ) {
    return this.commentsService.updateComment(id, user._id, user.role, body);
  }

  @Auth()
  @Delete(":id")
  async softDeleteComment(@Param("id") id: string, @User() user: UserDocument) {
    return this.commentsService.softDeleteComment(id, user._id, user.role);
  }

  @Auth()
  @Patch(":id/restore")
  async restoreComment(@Param("id") id: string, @User() user: UserDocument) {
    return this.commentsService.restoreComment(id, user._id, user.role);
  }

  @Auth()
  @Delete(":id/hard")
  async hardDeleteComment(@Param("id") id: string, @User() user: UserDocument) {
    return this.commentsService.hardDeleteComment(id, user._id, user.role);
  }

  @Auth()
  @Put(":id/reactions")
  async setCommentReaction(@Param("id") id: string, @User() user: UserDocument) {
    return this.commentsService.setCommentReaction(id, user._id);
  }

  @Auth()
  @Delete(":id/reactions")
  async removeCommentReaction(@Param("id") id: string, @User() user: UserDocument) {
    return this.commentsService.removeCommentReaction(id, user._id);
  }

  @Auth()
  @Put(":id/likes")
  async setCommentLike(@Param("id") id: string, @User() user: UserDocument) {
    return this.commentsService.setCommentReaction(id, user._id);
  }

  @Auth()
  @Delete(":id/likes")
  async removeCommentLike(@Param("id") id: string, @User() user: UserDocument) {
    return this.commentsService.removeCommentReaction(id, user._id);
  }
}
