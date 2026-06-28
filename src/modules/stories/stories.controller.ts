import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from "@nestjs/common";
import { StoriesService } from "./stories.service";
import { Auth } from "../../common/decorators/auth.decorator";
import { User } from "../../common/decorators/current-user.decorator";
import { UserDocument } from "../../models/user.model";

@Controller("api/stories")
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Auth()
  @Post()
  async createStory(@User() user: UserDocument, @Body() body: any) {
    return this.storiesService.createStory(user._id, body);
  }

  @Auth()
  @Get()
  async getActiveStories(@Query() query: any) {
    return this.storiesService.getActiveStories(query);
  }

  @Auth()
  @Get("me")
  async getMyStories(@User() user: UserDocument) {
    return this.storiesService.getMyStories(user._id);
  }

  @Auth()
  @Get(":id")
  async getStory(@Param("id") id: string, @User() user: UserDocument) {
    return this.storiesService.getStory(id, user._id, user.role);
  }

  @Auth()
  @Patch(":id")
  async updateStory(@Param("id") id: string, @User() user: UserDocument, @Body() body: any) {
    return this.storiesService.updateStory(id, user._id, user.role, body);
  }

  @Auth()
  @Delete(":id")
  async softDeleteStory(@Param("id") id: string, @User() user: UserDocument) {
    return this.storiesService.softDeleteStory(id, user._id, user.role);
  }

  @Auth()
  @Patch(":id/restore")
  async restoreStory(@Param("id") id: string, @User() user: UserDocument) {
    return this.storiesService.restoreStory(id, user._id, user.role);
  }

  @Auth()
  @Delete(":id/hard")
  async hardDeleteStory(@Param("id") id: string, @User() user: UserDocument) {
    return this.storiesService.hardDeleteStory(id, user._id, user.role);
  }

  @Auth()
  @Put(":id/reactions")
  async setStoryReaction(@Param("id") id: string, @User() user: UserDocument, @Body() body: any) {
    return this.storiesService.setStoryReaction(id, user._id, body);
  }

  @Auth()
  @Delete(":id/reactions")
  async removeStoryReaction(@Param("id") id: string, @User() user: UserDocument) {
    return this.storiesService.removeStoryReaction(id, user._id);
  }
}
