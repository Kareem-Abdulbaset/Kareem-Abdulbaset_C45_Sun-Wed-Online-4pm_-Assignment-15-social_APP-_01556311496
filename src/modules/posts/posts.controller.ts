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
import { PostsService } from "./posts.service";
import { AuthGuard } from "../../common/guards/auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserDocument } from "../../models/user.model";

@Controller("api/posts")
@UseGuards(AuthGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get("feed")
  async getNewsFeed(@Query() query: any) {
    return this.postsService.getNewsFeed(query);
  }

  @Get("profile/:userId")
  async getProfilePosts(@Param("userId") userId: string, @Query() query: any) {
    return this.postsService.getProfilePosts(userId, query);
  }

  @Post()
  async createPost(@CurrentUser() user: UserDocument, @Body() body: any) {
    return this.postsService.createPost(user._id, body);
  }

  @Get()
  async getAllPosts(@Query() query: any, @CurrentUser() user: UserDocument) {
    return this.postsService.getAllPosts(query, user.role === "admin");
  }

  @Get(":id")
  async getPost(@Param("id") id: string, @CurrentUser() user: UserDocument) {
    return this.postsService.getPost(id, user.role === "admin");
  }

  @Patch(":id")
  async updatePost(
    @Param("id") id: string,
    @CurrentUser() user: UserDocument,
    @Body() body: any
  ) {
    return this.postsService.updatePost(id, user._id, user.role, body);
  }

  @Delete(":id")
  async softDeletePost(@Param("id") id: string, @CurrentUser() user: UserDocument) {
    return this.postsService.softDeletePost(id, user._id, user.role);
  }

  @Patch(":id/restore")
  async restorePost(@Param("id") id: string, @CurrentUser() user: UserDocument) {
    return this.postsService.restorePost(id, user._id, user.role);
  }

  @Delete(":id/hard")
  async hardDeletePost(@Param("id") id: string, @CurrentUser() user: UserDocument) {
    return this.postsService.hardDeletePost(id, user._id, user.role);
  }

  @Put(":id/reactions")
  async setPostReaction(
    @Param("id") id: string,
    @CurrentUser() user: UserDocument,
    @Body() body: any
  ) {
    return this.postsService.setPostReactionWithType(id, user._id, body);
  }

  @Delete(":id/reactions")
  async removePostReaction(@Param("id") id: string, @CurrentUser() user: UserDocument) {
    return this.postsService.removePostReaction(id, user._id);
  }

  @Put(":id/likes")
  async setPostLike(@Param("id") id: string, @CurrentUser() user: UserDocument) {
    return this.postsService.setPostReaction(id, user._id);
  }

  @Delete(":id/likes")
  async removePostLike(@Param("id") id: string, @CurrentUser() user: UserDocument) {
    return this.postsService.removePostReaction(id, user._id);
  }
}
