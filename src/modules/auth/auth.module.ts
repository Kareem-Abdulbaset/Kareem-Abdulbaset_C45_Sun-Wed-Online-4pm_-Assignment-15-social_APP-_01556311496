import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { RedisService } from "../../common/services/redis.service";
import { EmailService } from "../../common/services/email.service";
import { TokenService } from "../../common/services/token.service";

@Module({
  controllers: [AuthController],
  providers: [AuthService, RedisService, EmailService, TokenService],
  exports: [AuthService, TokenService]
})
export class AuthModule {}
