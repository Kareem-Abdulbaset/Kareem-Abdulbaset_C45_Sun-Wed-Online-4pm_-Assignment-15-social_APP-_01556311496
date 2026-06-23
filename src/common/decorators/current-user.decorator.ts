import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Request } from "express";
import { UserDocument } from "../../models/user.model";

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserDocument => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user as UserDocument;
  }
);
