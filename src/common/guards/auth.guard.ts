import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Request } from "express";
import { env } from "../../config/env";
import { User } from "../../models/user.model";
import { RedisService } from "../services/redis.service";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authorization = request.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      throw new UnauthorizedException("Token is required");
    }

    const token = authorization.split(" ")[1];

    if (await this.redisService.isTokenBlacklisted(token)) {
      throw new UnauthorizedException("Please login again");
    }

    let payload: JwtPayload;

    try {
      payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
    } catch {
      throw new UnauthorizedException("Please login again");
    }

    const user = await User.findOne({ _id: payload.id, deletedAt: null });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    if (user.passwordChangedAt && payload.iat) {
      const passwordChangedAt = Math.floor(user.passwordChangedAt.getTime() / 1000);

      if (payload.iat < passwordChangedAt) {
        throw new UnauthorizedException("Password changed, please login again");
      }
    }

    (request as any).user = user;
    (request as any).token = token;

    return true;
  }
}
