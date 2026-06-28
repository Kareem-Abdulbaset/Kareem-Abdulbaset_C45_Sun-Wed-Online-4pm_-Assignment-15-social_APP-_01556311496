import { Controller, Get, Query } from "@nestjs/common";
import { PostsService } from "../posts/posts.service";
import { Auth } from "../../common/decorators/auth.decorator";

@Controller("api/feed")
export class FeedController {
  constructor(private readonly postsService: PostsService) {}

  @Auth()
  @Get()
  async getNewsFeed(@Query() query: any) {
    return this.postsService.getNewsFeed(query);
  }
}
