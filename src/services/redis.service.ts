import { redisClient } from "../config/redis";
import { env } from "../config/env";

export const saveCode = async (key: string, code: string, seconds = 600) => {
  await redisClient.setEx(key, seconds, code);
};

export const getCode = async (key: string) => {
  return redisClient.get(key);
};

export const deleteKey = async (key: string) => {
  await redisClient.del(key);
};

export const addTokenToBlacklist = async (token: string, seconds = env.jwtBlacklistSeconds) => {
  await redisClient.setEx(`blacklist:${token}`, seconds, "true");
};

export const isTokenBlacklisted = async (token: string) => {
  const value = await redisClient.get(`blacklist:${token}`);
  return Boolean(value);
};
