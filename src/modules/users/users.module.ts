import { Module } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { PostsModule } from "../posts/posts.module";
import { RedisService } from "../../common/services/redis.service";
import { TokenService } from "../../common/services/token.service";

@Module({
  imports: [PostsModule],
  controllers: [UsersController],
  providers: [UsersService, RedisService, TokenService],
  exports: [UsersService]
})
export class UsersModule {}
