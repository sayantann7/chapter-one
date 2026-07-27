import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "../../../prisma/prisma.service";
import { AccessTokenPayload } from "../interfaces/jwt-payload.interface";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret =
      configService.get<string>("JWT_SECRET") ||
      "chapter-one-super-secret-jwt-key-2026";
    const issuer =
      configService.get<string>("JWT_ISSUER") || "chapter-one-auth";
    const audience =
      configService.get<string>("JWT_AUDIENCE") || "chapter-one-api";

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      issuer,
      audience,
    });
  }

  async validate(payload: AccessTokenPayload) {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException("Invalid token payload");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    const deletedAt = (user as any)?.deletedAt;
    if (!user || deletedAt) {
      throw new UnauthorizedException(
        "User account not found or has been deleted",
      );
    }

    // Omit sensitive passwordHash before attaching user object to request.user
    const sanitizedUser = { ...user };
    delete (sanitizedUser as any).passwordHash;
    return sanitizedUser;
  }
}
