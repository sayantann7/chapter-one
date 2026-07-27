import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as crypto from "crypto";
import {
  AccessTokenPayload,
  RefreshTokenPayload,
} from "../interfaces/jwt-payload.interface";

export interface UserContext {
  id: string;
  email: string | null;
  status: string;
  role: string;
}

@Injectable()
export class TokenService {
  private readonly issuer: string;
  private readonly audience: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.issuer = this.configService.get<string>(
      "JWT_ISSUER",
      "chapter-one-auth",
    );
    this.audience = this.configService.get<string>(
      "JWT_AUDIENCE",
      "chapter-one-api",
    );
  }

  generateFamilyId(): string {
    return crypto.randomUUID();
  }

  generateTokenId(): string {
    return crypto.randomUUID();
  }

  async generateAccessToken(user: UserContext): Promise<string> {
    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      status: user.status,
      role: user.role,
      jti: `jwt_${this.generateTokenId()}`,
    };

    return this.jwtService.signAsync(payload, {
      issuer: this.issuer,
      audience: this.audience,
    });
  }

  generateRefreshTokenString(
    userId: string,
    familyId: string,
    tokenId: string,
  ): string {
    return `rf_${userId}_${familyId}_${tokenId}`;
  }

  parseRefreshTokenString(refreshTokenString: string): RefreshTokenPayload {
    if (!refreshTokenString || typeof refreshTokenString !== "string") {
      throw new UnauthorizedException("Invalid refresh token format");
    }

    const parts = refreshTokenString.split("_");
    if (parts.length !== 4 || parts[0] !== "rf") {
      throw new UnauthorizedException("Invalid refresh token format");
    }

    return {
      userId: parts[1],
      familyId: parts[2],
      tokenId: parts[3],
    };
  }

  async verifyJwt(token: string): Promise<AccessTokenPayload> {
    try {
      return await this.jwtService.verifyAsync<AccessTokenPayload>(token, {
        issuer: this.issuer,
        audience: this.audience,
      });
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }

  decodeJwt(token: string): AccessTokenPayload | null {
    return this.jwtService.decode<AccessTokenPayload>(token);
  }
}
