import { applyDecorators, UseGuards } from "@nestjs/common";
import { UserRole } from "../../models/user.model";
import { AuthGuard } from "../guards/auth.guard";
import { RolesGuard } from "../guards/roles.guard";
import { Roles } from "./roles.decorator";

/**
 * @Auth() - يطلب authentication فقط
 * @Auth("admin") - يطلب authentication + admin role
 * @Auth("admin", "user") - يطلب authentication + أحد الأدوار
 */
export function Auth(...roles: UserRole[]) {
  if (roles.length) {
    return applyDecorators(UseGuards(AuthGuard, RolesGuard), Roles(...roles));
  }

  return applyDecorators(UseGuards(AuthGuard));
}
