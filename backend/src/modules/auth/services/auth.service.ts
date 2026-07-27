import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { LoginDto } from "../dto/login.dto";
import { RefreshTokenDto } from "../dto/refresh-token.dto";
import { RegisterDto } from "../dto/register.dto";
import { VerifyCodeDto } from "../dto/verify-code.dto";
import { PasswordService } from "./password.service";
import { DeviceInfo, SessionService } from "./session.service";
import { TokenService } from "./token.service";
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

export interface TokenPairResult {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface LoginResult {
  user: {
    id: string;
    email: string | null;
    status: string;
    role: string;
  };
  tokens: TokenPairResult;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly verificationService: VerificationService,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
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

    await this.verificationService.deleteVerificationCode(dto.userId);

    const updatedUser = await this.prisma.user.update({
      where: { id: dto.userId },
      data: { status: "PENDING_ONBOARDING", isVerified: true },
    });

    return {
      userId: updatedUser.id,
      status: updatedUser.status,
    };
  }

  async login(dto: LoginDto, deviceInfo?: DeviceInfo): Promise<LoginResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isPasswordValid = await this.passwordService.verifyPassword(
      user.passwordHash,
      dto.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (user.status === "UNVERIFIED") {
      throw new UnauthorizedException(
        "Account is not verified. Please verify your account first.",
      );
    }

    if (user.status === "SUSPENDED" || user.status === "DEACTIVATED") {
      throw new UnauthorizedException("Account is suspended or deactivated");
    }

    const userContext = {
      id: user.id,
      email: user.email,
      status: user.status,
      role: user.role,
    };

    const familyId = this.tokenService.generateFamilyId();
    const tokenId = this.tokenService.generateTokenId();
    const accessToken =
      await this.tokenService.generateAccessToken(userContext);
    const refreshToken = this.tokenService.generateRefreshTokenString(
      user.id,
      familyId,
      tokenId,
    );

    await this.sessionService.createSession(
      user.id,
      familyId,
      tokenId,
      deviceInfo,
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: { updatedAt: new Date() },
    });

    return {
      user: userContext,
      tokens: {
        accessToken,
        refreshToken,
        tokenType: "Bearer",
        expiresIn: 900,
      },
    };
  }

  async refreshToken(
    dto: RefreshTokenDto,
    deviceInfo?: DeviceInfo,
  ): Promise<TokenPairResult> {
    const payload = this.tokenService.parseRefreshTokenString(dto.refreshToken);

    const session = await this.sessionService.getSession(
      payload.userId,
      payload.familyId,
    );
    if (!session || session.tokenId !== payload.tokenId) {
      throw new UnauthorizedException(
        "Refresh token has expired or is invalid",
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new UnauthorizedException("User account not found");
    }

    if (
      user.status === "UNVERIFIED" ||
      user.status === "SUSPENDED" ||
      user.status === "DEACTIVATED"
    ) {
      throw new UnauthorizedException(
        "Account is suspended, deactivated, or unverified",
      );
    }

    const userContext = {
      id: user.id,
      email: user.email,
      status: user.status,
      role: user.role,
    };

    const newTokenId = this.tokenService.generateTokenId();
    const newRefreshToken = this.tokenService.generateRefreshTokenString(
      payload.userId,
      payload.familyId,
      newTokenId,
    );

    await this.sessionService.updateSession(
      payload.userId,
      payload.familyId,
      newTokenId,
      deviceInfo,
    );

    const newAccessToken =
      await this.tokenService.generateAccessToken(userContext);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      tokenType: "Bearer",
      expiresIn: 900,
    };
  }
}
