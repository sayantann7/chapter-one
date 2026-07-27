import { ConflictException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { RegisterDto } from "../dto/register.dto";
import { PasswordService } from "./password.service";
import { VerificationService } from "./verification.service";

export interface RegistrationResult {
  userId: string;
  status: string;
  verificationExpiresInSeconds: number;
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
}
