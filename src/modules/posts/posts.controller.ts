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
import { PostsService } from "./posts.service";
import { Auth } from "../../common/decorators/auth.decorator";
import { User } from "../../common/decorators/current-user.decorator";
import { UserDocument } from "../../models/user.model";

@Controller("api/posts")
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Auth()
  @Get("feed")
  async getNewsFeed(@Query() query: any) {
    return this.postsService.getNewsFeed(query);
  }

  @Auth()
  @Get("profile/:userId")
  async getProfilePosts(@Param("userId") userId: string, @Query() query: any) {
    return this.postsService.getProfilePosts(userId, query);
  }

  @Auth()
  @Post()
  async createPost(@User() user: UserDocument, @Body() body: any) {
    return this.postsService.createPost(user._id, body);
  }

  @Auth()
  @Get()
  async getAllPosts(@Query() query: any, @User() user: UserDocument) {
    return this.postsService.getAllPosts(query, user.role === "admin");
  }

  @Auth()
  @Get(":id")
  async getPost(@Param("id") id: string, @User() user: UserDocument) {
    return this.postsService.getPost(id, user.role === "admin");
  }

  @Auth()
  @Patch(":id")
  async updatePost(
    @Param("id") id: string,
    @User() user: UserDocument,
    @Body() body: any
  ) {
    return this.postsService.updatePost(id, user._id, user.role, body);
  }

  @Auth()
  @Delete(":id")
  async softDeletePost(@Param("id") id: string, @User() user: UserDocument) {
    return this.postsService.softDeletePost(id, user._id, user.role);
  }

  @Auth()
  @Patch(":id/restore")
  async restorePost(@Param("id") id: string, @User() user: UserDocument) {
    return this.postsService.restorePost(id, user._id, user.role);
  }

  @Auth()
  @Delete(":id/hard")
  async hardDeletePost(@Param("id") id: string, @User() user: UserDocument) {
    return this.postsService.hardDeletePost(id, user._id, user.role);
  }

  @Auth()
  @Put(":id/reactions")
  async setPostReaction(
    @Param("id") id: string,
    @User() user: UserDocument,
    @Body() body: any
  ) {
    return this.postsService.setPostReactionWithType(id, user._id, body);
  }

  @Auth()
  @Delete(":id/reactions")
  async removePostReaction(@Param("id") id: string, @User() user: UserDocument) {
    return this.postsService.removePostReaction(id, user._id);
  }

  @Auth()
  @Put(":id/likes")
  async setPostLike(@Param("id") id: string, @User() user: UserDocument) {
    return this.postsService.setPostReaction(id, user._id);
  }

  @Auth()
  @Delete(":id/likes")
  async removePostLike(@Param("id") id: string, @User() user: UserDocument) {
    return this.postsService.removePostReaction(id, user._id);
  }
}
