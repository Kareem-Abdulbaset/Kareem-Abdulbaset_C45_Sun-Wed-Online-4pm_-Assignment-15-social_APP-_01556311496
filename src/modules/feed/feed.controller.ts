import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { PostsService } from "../posts/posts.service";
import { AuthGuard } from "../../common/guards/auth.guard";

@Controller("api/feed")
@UseGuards(AuthGuard)
export class FeedController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  async getNewsFeed(@Query() query: any) {
    return this.postsService.getNewsFeed(query);
  }
}
