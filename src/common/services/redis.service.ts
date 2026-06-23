import { Injectable, OnModuleInit } from "@nestjs/common";
import { createClient, RedisClientType } from "redis";
import { env } from "../../config/env";

@Injectable()
export class RedisService implements OnModuleInit {
  private client: RedisClientType;

  constructor() {
    this.client = createClient({ url: env.redisUrl }) as RedisClientType;
    this.client.on("error", (error) => {
      console.log("Redis error", error);
    });
  }

  async onModuleInit() {
    if (!this.client.isOpen) {
      await this.client.connect();
      console.log("Redis connected");
    }
  }

  async saveCode(key: string, code: string, seconds = 600) {
    await this.client.setEx(key, seconds, code);
  }

  async getCode(key: string) {
    return this.client.get(key);
  }

  async deleteKey(key: string) {
    await this.client.del(key);
  }

  async addTokenToBlacklist(token: string, seconds = env.jwtBlacklistSeconds) {
    await this.client.setEx(`blacklist:${token}`, seconds, "true");
  }

  async isTokenBlacklisted(token: string) {
    const value = await this.client.get(`blacklist:${token}`);
    return Boolean(value);
  }
}
