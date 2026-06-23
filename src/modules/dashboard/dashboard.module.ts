import { Module } from "@nestjs/common";
import { DashboardController } from "./dashboard.controller";
import { UsersModule } from "../users/users.module";
import { RedisService } from "../../common/services/redis.service";

@Module({
  imports: [UsersModule],
  controllers: [DashboardController],
  providers: [RedisService]
})
export class DashboardModule {}
