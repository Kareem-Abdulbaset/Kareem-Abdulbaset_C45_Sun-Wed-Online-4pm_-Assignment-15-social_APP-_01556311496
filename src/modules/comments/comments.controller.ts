import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards
} from "@nestjs/common";
import { CommentsService } from "./comments.service";
import { AuthGuard } from "../../common/guards/auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserDocument } from "../../models/user.model";

@Controller("api/comments")
@UseGuards(AuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post("post/:postId")
  async createComment(
    @Param("postId") postId: string,
    @CurrentUser() user: UserDocument,
    @Body() body: any
  ) {
    return this.commentsService.createComment(postId, user._id, body);
  }

  @Get("post/:postId")
  async getPostComments(@Param("postId") postId: string, @Query() query: any) {
    return this.commentsService.getPostComments(postId, query);
  }

  @Post(":id/replies")
  async createReply(
    @Param("id") id: string,
    @CurrentUser() user: UserDocument,
    @Body() body: any
  ) {
    return this.commentsService.createReply(id, user._id, body);
  }

  @Get(":id/replies")
  async getCommentReplies(@Param("id") id: string, @Query() query: any) {
    return this.commentsService.getCommentReplies(id, query);
  }

  @Get(":id")
  async getComment(@Param("id") id: string, @CurrentUser() user: UserDocument) {
    return this.commentsService.getComment(id, user.role === "admin");
  }

  @Patch(":id")
  async updateComment(
    @Param("id") id: string,
    @CurrentUser() user: UserDocument,
    @Body() body: any
  ) {
    return this.commentsService.updateComment(id, user._id, user.role, body);
  }

  @Delete(":id")
  async softDeleteComment(@Param("id") id: string, @CurrentUser() user: UserDocument) {
    return this.commentsService.softDeleteComment(id, user._id, user.role);
  }

  @Patch(":id/restore")
  async restoreComment(@Param("id") id: string, @CurrentUser() user: UserDocument) {
    return this.commentsService.restoreComment(id, user._id, user.role);
  }

  @Delete(":id/hard")
  async hardDeleteComment(@Param("id") id: string, @CurrentUser() user: UserDocument) {
    return this.commentsService.hardDeleteComment(id, user._id, user.role);
  }

  @Put(":id/reactions")
  async setCommentReaction(@Param("id") id: string, @CurrentUser() user: UserDocument) {
    return this.commentsService.setCommentReaction(id, user._id);
  }

  @Delete(":id/reactions")
  async removeCommentReaction(@Param("id") id: string, @CurrentUser() user: UserDocument) {
    return this.commentsService.removeCommentReaction(id, user._id);
  }

  @Put(":id/likes")
  async setCommentLike(@Param("id") id: string, @CurrentUser() user: UserDocument) {
    return this.commentsService.setCommentReaction(id, user._id);
  }

  @Delete(":id/likes")
  async removeCommentLike(@Param("id") id: string, @CurrentUser() user: UserDocument) {
    return this.commentsService.removeCommentReaction(id, user._id);
  }
}
