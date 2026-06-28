import { Module } from "@nestjs/common";
import { DashboardController } from "./dashboard.controller";
import { UsersModule } from "../users/users.module";
import { RedisService } from "../../common/services/redis.service";
import { TokenService } from "../../common/services/token.service";

@Module({
  imports: [UsersModule],
  controllers: [DashboardController],
  providers: [RedisService, TokenService]
})
export class DashboardModule {}
