import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, Req } from "@nestjs/common";
import { Request } from "express";
import { AuthService } from "./auth.service";
import { Auth } from "../../common/decorators/auth.decorator";
import { User } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { UserDocument } from "../../models/user.model";

@Controller("api/auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("signup")
  async signup(@Body() body: any) {
    return this.authService.signup(body);
  }

  @Public()
  @Post("confirm-email")
  @HttpCode(HttpStatus.OK)
  async confirmEmail(@Body() body: any) {
    return this.authService.confirmEmail(body);
  }

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: any) {
    return this.authService.login(body);
  }

  @Public()
  @Post("google")
  @HttpCode(HttpStatus.OK)
  async googleLogin(@Body() body: any) {
    return this.authService.googleLogin(body);
  }

  @Public()
  @Post("gmail-login")
  @HttpCode(HttpStatus.OK)
  async gmailLogin(@Body() body: any) {
    return this.authService.googleLogin(body);
  }

  @Public()
  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: any) {
    return this.authService.forgotPassword(body);
  }

  @Public()
  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: any) {
    return this.authService.resetPassword(body);
  }

  @Auth()
  @Patch("update-password")
  async updatePassword(@User() user: UserDocument, @Body() body: any) {
    return this.authService.updatePassword(user._id.toString(), body);
  }

  @Auth()
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request) {
    return this.authService.logout((req as any).token);
  }

  @Auth()
  @Get("me")
  async getProfile(@User() user: UserDocument) {
    return {
      success: true,
      user
    };
  }
}
