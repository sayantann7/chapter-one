import { Module } from "@nestjs/common";
import { AuthController } from "./controllers/auth.controller";
import { AuthService } from "./services/auth.service";
import { PasswordService } from "./services/password.service";
import { VerificationService } from "./services/verification.service";

@Module({
  controllers: [AuthController],
  providers: [AuthService, PasswordService, VerificationService],
  exports: [AuthService, PasswordService, VerificationService],
})
export class AuthModule {}
