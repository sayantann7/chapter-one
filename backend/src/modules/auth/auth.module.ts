import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./controllers/auth.controller";
import { AuthService } from "./services/auth.service";
import { PasswordService } from "./services/password.service";
import { TokenService } from "./services/token.service";
import { VerificationService } from "./services/verification.service";

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret =
          configService.get<string>("JWT_SECRET") ||
          "chapter-one-super-secret-jwt-key-2026";
        const expiresIn = configService.get<string>("JWT_EXPIRES_IN") || "900s";
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
  providers: [AuthService, PasswordService, VerificationService, TokenService],
  exports: [
    AuthService,
    PasswordService,
    VerificationService,
    TokenService,
    JwtModule,
  ],
})
export class AuthModule {}
