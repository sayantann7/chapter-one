import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./controllers/auth.controller";
import { AuthService } from "./services/auth.service";
import { PasswordService } from "./services/password.service";
import { SessionService } from "./services/session.service";
import { TokenService } from "./services/token.service";
import { VerificationService } from "./services/verification.service";
import { JwtStrategy } from "./strategies/jwt.strategy";

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret =
          configService.get<string>("JWT_SECRET") ||
          "chapter-one-super-secret-jwt-key-2026";
        const expiresIn =
          configService.get<string>("JWT_ACCESS_EXPIRES_IN") || "900s";
        return {
          secret,
          signOptions: {
            expiresIn: expiresIn as any,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    VerificationService,
    TokenService,
    SessionService,
    JwtStrategy,
  ],
  exports: [
    AuthService,
    PasswordService,
    VerificationService,
    TokenService,
    SessionService,
    JwtStrategy,
    PassportModule,
    JwtModule,
  ],
})
export class AuthModule {}
