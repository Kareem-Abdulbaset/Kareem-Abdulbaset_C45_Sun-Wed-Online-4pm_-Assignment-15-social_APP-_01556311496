import { Controller, Get, UseGuards } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { AuthGuard } from "../../common/guards/auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@Controller("api/dashboard")
@UseGuards(AuthGuard, RolesGuard)
@Roles("admin")
export class DashboardController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getDashboard() {
    return this.usersService.getDashboard();
  }
}
