import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Request } from "express";
import { UserDocument } from "../../models/user.model";

/**
 * @User() - يرجع الـ user كامل
 * @User("_id") - يرجع الـ _id فقط
 * @User("email") - يرجع الـ email فقط
 * @User("role") - يرجع الـ role فقط
 */
export const User = createParamDecorator(
  (data: keyof UserDocument | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as UserDocument;

    if (data) {
      return user?.[data];
    }

    return user;
  }
);

// Alias - backward compatible
export const CurrentUser = User;
