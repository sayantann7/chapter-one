import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { RedisService } from "../../../redis/redis.service";
import * as crypto from "crypto";

export interface UserContext {
  id: string;
  email: string | null;
  status: string;
  role: string;
}

export interface DeviceInfo {
  userAgent?: string;
  ipAddress?: string;
}

export interface TokenPairResult {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  async generateAccessToken(user: UserContext): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
      status: user.status,
      role: user.role,
      jti: `jwt_${crypto.randomUUID()}`,
    };

    return this.jwtService.signAsync(payload);
  }

  async generateRefreshToken(
    userId: string,
    deviceInfo?: DeviceInfo,
    ttlSeconds = 604800, // 7 days
  ): Promise<{ refreshToken: string; familyId: string; tokenId: string }> {
    const familyId = crypto.randomUUID();
    const tokenId = crypto.randomUUID();
    const refreshToken = `rf_${familyId}_${tokenId}`;

    const redisKey = `auth:refresh:${userId}:${familyId}`;
    const sessionData = JSON.stringify({
      tokenId,
      createdAt: Math.floor(Date.now() / 1000),
      userAgent: deviceInfo?.userAgent || "Unknown",
      ipAddress: deviceInfo?.ipAddress || "Unknown",
    });

    await this.redisService.set(redisKey, sessionData, ttlSeconds);

    return {
      refreshToken,
      familyId,
      tokenId,
    };
  }

  async generateTokenPair(
    user: UserContext,
    deviceInfo?: DeviceInfo,
  ): Promise<TokenPairResult> {
    const accessToken = await this.generateAccessToken(user);
    const { refreshToken } = await this.generateRefreshToken(
      user.id,
      deviceInfo,
    );

    return {
      accessToken,
      refreshToken,
      tokenType: "Bearer",
      expiresIn: 900,
    };
  }
}
