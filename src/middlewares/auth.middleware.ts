import jwt, { JwtPayload } from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { env } from "../config/env";
import { User, UserRole } from "../models/user.model";
import { isTokenBlacklisted } from "../services/redis.service";

export const authentication = async (req: Request, res: Response, next: NextFunction) => {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return next(new AppError("Token is required", 401));
  }

  const token = authorization.split(" ")[1];

  if (await isTokenBlacklisted(token)) {
    return next(new AppError("Please login again", 401));
  }

  const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
  const user = await User.findById(payload.id);

  if (!user) {
    return next(new AppError("User not found", 401));
  }

  if (user.passwordChangedAt && payload.iat) {
    const passwordChangedAt = Math.floor(user.passwordChangedAt.getTime() / 1000);

    if (payload.iat < passwordChangedAt) {
      return next(new AppError("Password changed, please login again", 401));
    }
  }

  req.user = user;
  req.token = token;
  next();
};

export const authorization = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError("You are not allowed", 403));
    }

    next();
  };
};
