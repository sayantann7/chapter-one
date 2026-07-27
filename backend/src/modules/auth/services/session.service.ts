import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RedisService } from "../../../redis/redis.service";

export interface DeviceInfo {
  userAgent?: string;
  ipAddress?: string;
}

export interface SessionData {
  tokenId: string;
  createdAt: number;
  userAgent: string;
  ipAddress: string;
}

@Injectable()
export class SessionService {
  private readonly defaultTtlSeconds: number;

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    const rawRefreshExp = this.configService.get<string>(
      "JWT_REFRESH_EXPIRES_IN",
      "604800s",
    );
    const parsedSeconds = parseInt(rawRefreshExp.replace(/\D/g, ""), 10);
    this.defaultTtlSeconds =
      isNaN(parsedSeconds) || parsedSeconds <= 0 ? 604800 : parsedSeconds;
  }

  private buildKey(userId: string, familyId: string): string {
    return `auth:refresh:${userId}:${familyId}`;
  }

  async createSession(
    userId: string,
    familyId: string,
    tokenId: string,
    deviceInfo?: DeviceInfo,
    ttlSeconds = this.defaultTtlSeconds,
  ): Promise<void> {
    const redisKey = this.buildKey(userId, familyId);
    const sessionData: SessionData = {
      tokenId,
      createdAt: Math.floor(Date.now() / 1000),
      userAgent: deviceInfo?.userAgent || "Unknown",
      ipAddress: deviceInfo?.ipAddress || "Unknown",
    };

    await this.redisService.set(
      redisKey,
      JSON.stringify(sessionData),
      ttlSeconds,
    );
  }

  async getSession(
    userId: string,
    familyId: string,
  ): Promise<SessionData | null> {
    const redisKey = this.buildKey(userId, familyId);
    const sessionJson = await this.redisService.get(redisKey);

    if (!sessionJson) {
      return null;
    }

    try {
      return JSON.parse(sessionJson) as SessionData;
    } catch {
      return null;
    }
  }

  async updateSession(
    userId: string,
    familyId: string,
    newTokenId: string,
    deviceInfo?: DeviceInfo,
    ttlSeconds = this.defaultTtlSeconds,
  ): Promise<void> {
    const existingSession = await this.getSession(userId, familyId);

    const redisKey = this.buildKey(userId, familyId);
    const updatedData: SessionData = {
      tokenId: newTokenId,
      createdAt: Math.floor(Date.now() / 1000),
      userAgent:
        deviceInfo?.userAgent || existingSession?.userAgent || "Unknown",
      ipAddress:
        deviceInfo?.ipAddress || existingSession?.ipAddress || "Unknown",
    };

    await this.redisService.set(
      redisKey,
      JSON.stringify(updatedData),
      ttlSeconds,
    );
  }

  async deleteSession(userId: string, familyId: string): Promise<void> {
    const redisKey = this.buildKey(userId, familyId);
    await this.redisService.del(redisKey);
  }

  async deleteAllSessionsForUser(userId: string): Promise<void> {
    const pattern = `auth:refresh:${userId}:*`;
    const keys = await this.redisService.keys(pattern);
    if (keys.length > 0) {
      await Promise.all(keys.map((key) => this.redisService.del(key)));
    }
  }
}
