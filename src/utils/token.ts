import jwt from "jsonwebtoken";
import { env } from "../config/env";

export const createToken = (userId: string) => {
  return jwt.sign({ id: userId }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"]
  });
};
