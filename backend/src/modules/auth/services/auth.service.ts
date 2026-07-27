import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { RegisterDto } from "../dto/register.dto";
import { VerifyCodeDto } from "../dto/verify-code.dto";
import { PasswordService } from "./password.service";
import { VerificationService } from "./verification.service";

export interface RegistrationResult {
  userId: string;
  status: string;
  verificationExpiresInSeconds: number;
}

export interface VerificationResult {
  userId: string;
  status: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly verificationService: VerificationService,
  ) {}

  async register(dto: RegisterDto): Promise<RegistrationResult> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException("An account with this email already exists");
    }

    const passwordHash = await this.passwordService.hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        phoneNumber: dto.phoneNumber || null,
        status: "UNVERIFIED",
      },
    });

    const verificationCode =
      this.verificationService.generateVerificationCode();
    const ttlSeconds = 900;
    await this.verificationService.storeVerificationCode(
      user.id,
      verificationCode,
      ttlSeconds,
    );

    return {
      userId: user.id,
      status: user.status,
      verificationExpiresInSeconds: ttlSeconds,
    };
  }

  async verifyCode(dto: VerifyCodeDto): Promise<VerificationResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException("User account not found");
    }

    if (user.status !== "UNVERIFIED") {
      throw new BadRequestException(
        "Account is already verified or not pending verification",
      );
    }

    const storedCode = await this.verificationService.getVerificationCode(
      dto.userId,
    );

    if (!storedCode) {
      throw new BadRequestException(
        "Verification code has expired or does not exist",
      );
    }

    if (storedCode !== dto.code) {
      throw new BadRequestException("Invalid verification code");
    }

    // Delete code from Redis immediately to prevent reuse
    await this.verificationService.deleteVerificationCode(dto.userId);

    // Update user state to PENDING_ONBOARDING
    const updatedUser = await this.prisma.user.update({
      where: { id: dto.userId },
      data: { status: "PENDING_ONBOARDING", isVerified: true },
    });

    return {
      userId: updatedUser.id,
      status: updatedUser.status,
    };
  }
}
