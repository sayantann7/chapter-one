import { Injectable } from "@nestjs/common";
import { RedisService } from "../../../redis/redis.service";
import * as crypto from "crypto";

@Injectable()
export class VerificationService {
  constructor(private readonly redisService: RedisService) {}

  generateVerificationCode(): string {
    const codeNumber = crypto.randomInt(100000, 999999);
    return codeNumber.toString();
  }

  async storeVerificationCode(
    userId: string,
    code: string,
    ttlSeconds = 900,
  ): Promise<void> {
    const redisKey = `auth:code:${userId}`;
    await this.redisService.set(redisKey, code, ttlSeconds);
  }

  async getVerificationCode(userId: string): Promise<string | null> {
    const redisKey = `auth:code:${userId}`;
    return this.redisService.get(redisKey);
  }
}
