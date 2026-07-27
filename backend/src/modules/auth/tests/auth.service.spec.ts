import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../../prisma/prisma.service";
import { AuthService } from "../services/auth.service";
import { PasswordService } from "../services/password.service";
import { SessionService } from "../services/session.service";
import { TokenService } from "../services/token.service";
import { VerificationService } from "../services/verification.service";

describe("AuthService", () => {
  let service: AuthService;
  let prisma: PrismaService;
  let passwordService: PasswordService;
  let verificationService: VerificationService;
  let tokenService: TokenService;
  let sessionService: SessionService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockPasswordService = {
    hashPassword: jest.fn().mockResolvedValue("hashed_argon2id_password"),
    verifyPassword: jest.fn().mockResolvedValue(true),
  };

  const mockVerificationService = {
    generateVerificationCode: jest.fn().mockReturnValue("654321"),
    storeVerificationCode: jest.fn().mockResolvedValue(undefined),
    getVerificationCode: jest.fn().mockResolvedValue("654321"),
    deleteVerificationCode: jest.fn().mockResolvedValue(undefined),
  };

  const mockTokenService = {
    generateFamilyId: jest.fn().mockReturnValue("family-456"),
    generateTokenId: jest.fn().mockReturnValue("token-789"),
    generateAccessToken: jest
      .fn()
      .mockResolvedValue("mock_signed_jwt_access_token"),
    generateRefreshTokenString: jest
      .fn()
      .mockReturnValue("rf_user-uuid-123_family-456_token-789"),
    parseRefreshTokenString: jest.fn().mockReturnValue({
      userId: "user-uuid-123",
      familyId: "family-456",
      tokenId: "token-789",
    }),
  };

  const mockSessionService = {
    createSession: jest.fn().mockResolvedValue(undefined),
    getSession: jest.fn().mockResolvedValue({
      tokenId: "token-789",
      createdAt: 1774630000,
      userAgent: "Unknown",
      ipAddress: "Unknown",
    }),
    updateSession: jest.fn().mockResolvedValue(undefined),
    deleteSession: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PasswordService, useValue: mockPasswordService },
        { provide: VerificationService, useValue: mockVerificationService },
        { provide: TokenService, useValue: mockTokenService },
        { provide: SessionService, useValue: mockSessionService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    passwordService = module.get<PasswordService>(PasswordService);
    verificationService = module.get<VerificationService>(VerificationService);
    tokenService = module.get<TokenService>(TokenService);
    sessionService = module.get<SessionService>(SessionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("register", () => {
    it("should register a new user successfully", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: "user-uuid-123",
        email: "newuser@example.com",
        status: "UNVERIFIED",
      });

      const dto = {
        email: "newuser@example.com",
        password: "SecurePassword123!",
      };

      const result = await service.register(dto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      expect(passwordService.hashPassword).toHaveBeenCalledWith(dto.password);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: dto.email,
          passwordHash: "hashed_argon2id_password",
          phoneNumber: null,
          status: "UNVERIFIED",
        },
      });
      expect(verificationService.generateVerificationCode).toHaveBeenCalled();
      expect(verificationService.storeVerificationCode).toHaveBeenCalledWith(
        "user-uuid-123",
        "654321",
        900,
      );

      expect(result).toEqual({
        userId: "user-uuid-123",
        status: "UNVERIFIED",
        verificationExpiresInSeconds: 900,
      });
    });

    it("should throw ConflictException if email is already registered", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: "existing-user-id",
        email: "existing@example.com",
      });

      const dto = {
        email: "existing@example.com",
        password: "SecurePassword123!",
      };

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe("verifyCode", () => {
    it("should verify code successfully and update user status to PENDING_ONBOARDING", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: "user-uuid-123",
        status: "UNVERIFIED",
      });
      mockVerificationService.getVerificationCode.mockResolvedValue("654321");
      mockPrismaService.user.update.mockResolvedValue({
        id: "user-uuid-123",
        status: "PENDING_ONBOARDING",
      });

      const dto = {
        userId: "user-uuid-123",
        code: "654321",
      };

      const result = await service.verifyCode(dto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: dto.userId },
      });
      expect(verificationService.getVerificationCode).toHaveBeenCalledWith(
        dto.userId,
      );
      expect(verificationService.deleteVerificationCode).toHaveBeenCalledWith(
        dto.userId,
      );
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: dto.userId },
        data: { status: "PENDING_ONBOARDING", isVerified: true },
      });
      expect(result).toEqual({
        userId: "user-uuid-123",
        status: "PENDING_ONBOARDING",
      });
    });

    it("should throw NotFoundException if user does not exist", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const dto = { userId: "non-existent-user", code: "654321" };

      await expect(service.verifyCode(dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe("login", () => {
    it("should authenticate user and delegate token creation and session persistence", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: "user-uuid-123",
        email: "alex@example.com",
        passwordHash: "hashed_password",
        status: "PENDING_ONBOARDING",
        role: "USER",
      });
      mockPasswordService.verifyPassword.mockResolvedValue(true);
      mockPrismaService.user.update.mockResolvedValue({});

      const dto = {
        email: "alex@example.com",
        password: "SecurePassword123!",
      };

      const result = await service.login(dto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      expect(passwordService.verifyPassword).toHaveBeenCalledWith(
        "hashed_password",
        dto.password,
      );
      expect(tokenService.generateAccessToken).toHaveBeenCalled();
      expect(sessionService.createSession).toHaveBeenCalledWith(
        "user-uuid-123",
        "family-456",
        "token-789",
        undefined,
      );
      expect(result).toEqual({
        user: {
          id: "user-uuid-123",
          email: "alex@example.com",
          status: "PENDING_ONBOARDING",
          role: "USER",
        },
        tokens: {
          accessToken: "mock_signed_jwt_access_token",
          refreshToken: "rf_user-uuid-123_family-456_token-789",
          tokenType: "Bearer",
          expiresIn: 900,
        },
      });
    });

    it("should throw UnauthorizedException if user not found", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const dto = { email: "unknown@example.com", password: "password" };

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("refreshToken", () => {
    it("should rotate refresh token and return new token pair", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: "user-uuid-123",
        email: "alex@example.com",
        status: "PENDING_ONBOARDING",
        role: "USER",
      });

      const dto = { refreshToken: "rf_user-uuid-123_family-456_token-789" };

      const result = await service.refreshToken(dto);

      expect(tokenService.parseRefreshTokenString).toHaveBeenCalledWith(
        dto.refreshToken,
      );
      expect(sessionService.getSession).toHaveBeenCalledWith(
        "user-uuid-123",
        "family-456",
      );
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-uuid-123" },
      });
      expect(sessionService.updateSession).toHaveBeenCalled();
      expect(tokenService.generateAccessToken).toHaveBeenCalled();
      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("refreshToken");
    });

    it("should throw UnauthorizedException if session is invalid or tokenId mismatched", async () => {
      mockSessionService.getSession.mockResolvedValue({
        tokenId: "mismatched-token-id",
      });

      const dto = { refreshToken: "rf_user-uuid-123_family-456_token-789" };

      await expect(service.refreshToken(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
