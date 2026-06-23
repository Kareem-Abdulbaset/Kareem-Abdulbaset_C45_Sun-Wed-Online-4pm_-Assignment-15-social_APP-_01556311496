import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { PostsService } from "../posts/posts.service";
import { AuthGuard } from "../../common/guards/auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserDocument } from "../../models/user.model";

@Controller("api/users")
@UseGuards(AuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly postsService: PostsService
  ) {}

  @Get("dashboard")
  @UseGuards(RolesGuard)
  @Roles("admin")
  async getDashboard() {
    return this.usersService.getDashboard();
  }

  @Get(":userId/posts")
  async getProfilePosts(@Param("userId") userId: string, @Query() query: any) {
    return this.postsService.getProfilePosts(userId, query);
  }

  @Patch("me")
  async updateMe(@CurrentUser() user: UserDocument, @Body() body: any) {
    return this.usersService.updateMe(user, body);
  }

  @Delete("me")
  async softDeleteMe(@CurrentUser() user: UserDocument) {
    return this.usersService.softDeleteMe(user);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles("admin")
  async createUser(@Body() body: any) {
    return this.usersService.createUser(body);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles("admin")
  async getAllUsers(@Query() query: any) {
    return this.usersService.getAllUsers(query);
  }

  @Get(":id")
  async getUser(@Param("id") id: string, @CurrentUser() user: UserDocument) {
    return this.usersService.getUser(id, user.role === "admin");
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles("admin")
  async updateUser(@Param("id") id: string, @Body() body: any) {
    return this.usersService.updateUser(id, body);
  }

  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles("admin")
  async softDeleteUser(@Param("id") id: string) {
    return this.usersService.softDeleteUser(id);
  }

  @Patch(":id/restore")
  @UseGuards(RolesGuard)
  @Roles("admin")
  async restoreUser(@Param("id") id: string) {
    return this.usersService.restoreUser(id);
  }

  @Delete(":id/hard")
  @UseGuards(RolesGuard)
  @Roles("admin")
  async hardDeleteUser(@Param("id") id: string) {
    return this.usersService.hardDeleteUser(id);
  }
}
