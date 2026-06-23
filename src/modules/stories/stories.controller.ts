import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from "@nestjs/common";
import { StoriesService } from "./stories.service";
import { AuthGuard } from "../../common/guards/auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserDocument } from "../../models/user.model";

@Controller("api/stories")
@UseGuards(AuthGuard)
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Post()
  async createStory(@CurrentUser() user: UserDocument, @Body() body: any) {
    return this.storiesService.createStory(user._id, body);
  }

  @Get()
  async getActiveStories(@Query() query: any) {
    return this.storiesService.getActiveStories(query);
  }

  @Get("me")
  async getMyStories(@CurrentUser() user: UserDocument) {
    return this.storiesService.getMyStories(user._id);
  }

  @Get(":id")
  async getStory(@Param("id") id: string, @CurrentUser() user: UserDocument) {
    return this.storiesService.getStory(id, user._id, user.role);
  }

  @Patch(":id")
  async updateStory(@Param("id") id: string, @CurrentUser() user: UserDocument, @Body() body: any) {
    return this.storiesService.updateStory(id, user._id, user.role, body);
  }

  @Delete(":id")
  async softDeleteStory(@Param("id") id: string, @CurrentUser() user: UserDocument) {
    return this.storiesService.softDeleteStory(id, user._id, user.role);
  }

  @Patch(":id/restore")
  async restoreStory(@Param("id") id: string, @CurrentUser() user: UserDocument) {
    return this.storiesService.restoreStory(id, user._id, user.role);
  }

  @Delete(":id/hard")
  async hardDeleteStory(@Param("id") id: string, @CurrentUser() user: UserDocument) {
    return this.storiesService.hardDeleteStory(id, user._id, user.role);
  }

  @Put(":id/reactions")
  async setStoryReaction(@Param("id") id: string, @CurrentUser() user: UserDocument, @Body() body: any) {
    return this.storiesService.setStoryReaction(id, user._id, body);
  }

  @Delete(":id/reactions")
  async removeStoryReaction(@Param("id") id: string, @CurrentUser() user: UserDocument) {
    return this.storiesService.removeStoryReaction(id, user._id);
  }
}
