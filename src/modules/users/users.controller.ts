import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { PostsService } from "../posts/posts.service";
import { Auth } from "../../common/decorators/auth.decorator";
import { User } from "../../common/decorators/current-user.decorator";
import { UserDocument } from "../../models/user.model";

@Controller("api/users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly postsService: PostsService
  ) {}

  @Auth("admin")
  @Get("dashboard")
  async getDashboard() {
    return this.usersService.getDashboard();
  }

  @Auth()
  @Get(":userId/posts")
  async getProfilePosts(@Param("userId") userId: string, @Query() query: any) {
    return this.postsService.getProfilePosts(userId, query);
  }

  @Auth()
  @Patch("me")
  async updateMe(@User() user: UserDocument, @Body() body: any) {
    return this.usersService.updateMe(user, body);
  }

  @Auth()
  @Delete("me")
  async softDeleteMe(@User() user: UserDocument) {
    return this.usersService.softDeleteMe(user);
  }

  @Auth("admin")
  @Post()
  async createUser(@Body() body: any) {
    return this.usersService.createUser(body);
  }

  @Auth("admin")
  @Get()
  async getAllUsers(@Query() query: any) {
    return this.usersService.getAllUsers(query);
  }

  @Auth()
  @Get(":id")
  async getUser(@Param("id") id: string, @User() user: UserDocument) {
    return this.usersService.getUser(id, user.role === "admin");
  }

  @Auth("admin")
  @Patch(":id")
  async updateUser(@Param("id") id: string, @Body() body: any) {
    return this.usersService.updateUser(id, body);
  }

  @Auth("admin")
  @Delete(":id")
  async softDeleteUser(@Param("id") id: string) {
    return this.usersService.softDeleteUser(id);
  }

  @Auth("admin")
  @Patch(":id/restore")
  async restoreUser(@Param("id") id: string) {
    return this.usersService.restoreUser(id);
  }

  @Auth("admin")
  @Delete(":id/hard")
  async hardDeleteUser(@Param("id") id: string) {
    return this.usersService.hardDeleteUser(id);
  }
}
