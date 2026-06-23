import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { AuthGuard } from "../../common/guards/auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserDocument } from "../../models/user.model";

@Controller("api/chats")
@UseGuards(AuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get("me")
  async getChatUserData(@CurrentUser() user: UserDocument) {
    return this.chatService.getChatUserData(user);
  }

  @Get()
  async getMyChats(@CurrentUser() user: UserDocument, @Query() query: any) {
    return this.chatService.getMyChats(user._id, query);
  }

  @Post("private")
  async createPrivateChat(@CurrentUser() user: UserDocument, @Body() body: any) {
    return this.chatService.createPrivateChat(user._id, body);
  }

  @Post("message")
  async sendMessage(@CurrentUser() user: UserDocument, @Body() body: any) {
    return this.chatService.sendMessage(user._id, user, body);
  }

  @Post("group")
  async createGroupChat(@CurrentUser() user: UserDocument, @Body() body: any) {
    return this.chatService.createGroupChat(user._id, body);
  }

  @Get("group/:id")
  async getGroupChat(@Param("id") id: string, @CurrentUser() user: UserDocument, @Query() query: any) {
    return this.chatService.getGroupChat(id, user._id, query);
  }

  @Post("group/:id/messages")
  async sendGroupMessage(@Param("id") id: string, @CurrentUser() user: UserDocument, @Body() body: any) {
    return this.chatService.sendGroupMessage(id, user._id, user, body);
  }

  @Patch(":id/join")
  async joinRoom(@Param("id") id: string, @CurrentUser() user: UserDocument) {
    return this.chatService.joinRoom(id, user._id);
  }

  @Get(":id")
  async getChat(@Param("id") id: string, @CurrentUser() user: UserDocument, @Query() query: any) {
    return this.chatService.getChat(id, user._id, query);
  }

  @Post(":id/messages")
  async sendChatMessage(@Param("id") id: string, @CurrentUser() user: UserDocument, @Body() body: any) {
    return this.chatService.sendChatMessage(id, user._id, user, body);
  }
}
