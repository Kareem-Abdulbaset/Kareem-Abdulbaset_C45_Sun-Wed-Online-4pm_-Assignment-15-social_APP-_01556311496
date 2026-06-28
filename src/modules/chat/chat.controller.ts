import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { Auth } from "../../common/decorators/auth.decorator";
import { User } from "../../common/decorators/current-user.decorator";
import { UserDocument } from "../../models/user.model";

@Controller("api/chats")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Auth()
  @Get("me")
  async getChatUserData(@User() user: UserDocument) {
    return this.chatService.getChatUserData(user);
  }

  @Auth()
  @Get()
  async getMyChats(@User() user: UserDocument, @Query() query: any) {
    return this.chatService.getMyChats(user._id, query);
  }

  @Auth()
  @Post("private")
  async createPrivateChat(@User() user: UserDocument, @Body() body: any) {
    return this.chatService.createPrivateChat(user._id, body);
  }

  @Auth()
  @Post("message")
  async sendMessage(@User() user: UserDocument, @Body() body: any) {
    return this.chatService.sendMessage(user._id, user, body);
  }

  @Auth()
  @Post("group")
  async createGroupChat(@User() user: UserDocument, @Body() body: any) {
    return this.chatService.createGroupChat(user._id, body);
  }

  @Auth()
  @Get("group/:id")
  async getGroupChat(@Param("id") id: string, @User() user: UserDocument, @Query() query: any) {
    return this.chatService.getGroupChat(id, user._id, query);
  }

  @Auth()
  @Post("group/:id/messages")
  async sendGroupMessage(@Param("id") id: string, @User() user: UserDocument, @Body() body: any) {
    return this.chatService.sendGroupMessage(id, user._id, user, body);
  }

  @Auth()
  @Patch(":id/join")
  async joinRoom(@Param("id") id: string, @User() user: UserDocument) {
    return this.chatService.joinRoom(id, user._id);
  }

  @Auth()
  @Get(":id")
  async getChat(@Param("id") id: string, @User() user: UserDocument, @Query() query: any) {
    return this.chatService.getChat(id, user._id, query);
  }

  @Auth()
  @Post(":id/messages")
  async sendChatMessage(@Param("id") id: string, @User() user: UserDocument, @Body() body: any) {
    return this.chatService.sendChatMessage(id, user._id, user, body);
  }
}
