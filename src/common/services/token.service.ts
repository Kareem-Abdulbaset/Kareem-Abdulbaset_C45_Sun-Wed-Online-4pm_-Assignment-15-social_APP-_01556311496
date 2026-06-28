import { Injectable } from "@nestjs/common";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "../../config/env";

@Injectable()
export class TokenService {
  createToken(userId: string): string {
    return jwt.sign({ id: userId }, env.jwtSecret, {
      expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"]
    });
  }

  verifyToken(token: string): JwtPayload {
    return jwt.verify(token, env.jwtSecret) as JwtPayload;
  }

  decodeToken(token: string): JwtPayload | null {
    return jwt.decode(token) as JwtPayload | null;
  }

  getTokenExpirySeconds(token: string): number {
    const decoded = this.decodeToken(token);

    if (decoded?.exp) {
      return Math.max(decoded.exp - Math.floor(Date.now() / 1000), 1);
    }

    return env.jwtBlacklistSeconds;
  }
}
