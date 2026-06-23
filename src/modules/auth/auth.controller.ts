import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { AuthService } from "./auth.service";
import { AuthGuard } from "../../common/guards/auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserDocument } from "../../models/user.model";

@Controller("api/auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("signup")
  async signup(@Body() body: any) {
    return this.authService.signup(body);
  }

  @Post("confirm-email")
  @HttpCode(HttpStatus.OK)
  async confirmEmail(@Body() body: any) {
    return this.authService.confirmEmail(body);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: any) {
    return this.authService.login(body);
  }

  @Post("google")
  @HttpCode(HttpStatus.OK)
  async googleLogin(@Body() body: any) {
    return this.authService.googleLogin(body);
  }

  @Post("gmail-login")
  @HttpCode(HttpStatus.OK)
  async gmailLogin(@Body() body: any) {
    return this.authService.googleLogin(body);
  }

  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: any) {
    return this.authService.forgotPassword(body);
  }

  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: any) {
    return this.authService.resetPassword(body);
  }

  @Patch("update-password")
  @UseGuards(AuthGuard)
  async updatePassword(@CurrentUser() user: UserDocument, @Body() body: any) {
    return this.authService.updatePassword(user._id.toString(), body);
  }

  @Post("logout")
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request) {
    return this.authService.logout((req as any).token);
  }

  @Get("me")
  @UseGuards(AuthGuard)
  async getProfile(@CurrentUser() user: UserDocument) {
    return {
      success: true,
      user
    };
  }
}
