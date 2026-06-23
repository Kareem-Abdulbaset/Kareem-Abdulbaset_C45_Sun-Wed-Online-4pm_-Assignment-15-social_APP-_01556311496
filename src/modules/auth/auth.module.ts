import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { RedisService } from "../../common/services/redis.service";
import { EmailService } from "../../common/services/email.service";

@Module({
  controllers: [AuthController],
  providers: [AuthService, RedisService, EmailService],
  exports: [AuthService]
})
export class AuthModule {}
