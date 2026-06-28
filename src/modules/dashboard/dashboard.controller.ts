import { Controller, Get } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { Auth } from "../../common/decorators/auth.decorator";

@Controller("api/dashboard")
export class DashboardController {
  constructor(private readonly usersService: UsersService) {}

  @Auth("admin")
  @Get()
  async getDashboard() {
    return this.usersService.getDashboard();
  }
}
