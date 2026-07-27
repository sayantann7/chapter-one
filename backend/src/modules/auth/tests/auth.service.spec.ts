import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../../prisma/prisma.service";
import { AuthService } from "../services/auth.service";
import { PasswordService } from "../services/password.service";
import { TokenService } from "../services/token.service";
import { VerificationService } from "../services/verification.service";

describe("AuthService", () => {
  let service: AuthService;
  let prisma: PrismaService;
  let passwordService: PasswordService;
  let verificationService: VerificationService;
  let tokenService: TokenService;

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
    generateTokenPair: jest.fn().mockResolvedValue({
      accessToken: "mock_signed_jwt_access_token",
      refreshToken: "rf_family_token",
      tokenType: "Bearer",
      expiresIn: 900,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PasswordService, useValue: mockPasswordService },
        { provide: VerificationService, useValue: mockVerificationService },
        { provide: TokenService, useValue: mockTokenService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    passwordService = module.get<PasswordService>(PasswordService);
    verificationService = module.get<VerificationService>(VerificationService);
    tokenService = module.get<TokenService>(TokenService);
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

    it("should throw BadRequestException if user status is not UNVERIFIED", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: "user-uuid-123",
        status: "PENDING_ONBOARDING",
      });

      const dto = { userId: "user-uuid-123", code: "654321" };

      await expect(service.verifyCode(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException if code is expired / missing in Redis", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: "user-uuid-123",
        status: "UNVERIFIED",
      });
      mockVerificationService.getVerificationCode.mockResolvedValue(null);

      const dto = { userId: "user-uuid-123", code: "654321" };

      await expect(service.verifyCode(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException if code is incorrect", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: "user-uuid-123",
        status: "UNVERIFIED",
      });
      mockVerificationService.getVerificationCode.mockResolvedValue("654321");

      const dto = { userId: "user-uuid-123", code: "000000" };

      await expect(service.verifyCode(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("login", () => {
    it("should authenticate user and delegate token creation to TokenService", async () => {
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
      expect(tokenService.generateTokenPair).toHaveBeenCalledWith(
        {
          id: "user-uuid-123",
          email: "alex@example.com",
          status: "PENDING_ONBOARDING",
          role: "USER",
        },
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
          refreshToken: "rf_family_token",
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

    it("should throw UnauthorizedException if password is wrong", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: "user-uuid-123",
        email: "alex@example.com",
        passwordHash: "hashed_password",
        status: "VERIFIED",
      });
      mockPasswordService.verifyPassword.mockResolvedValue(false);

      const dto = { email: "alex@example.com", password: "WrongPassword" };

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException if user status is UNVERIFIED", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: "user-uuid-123",
        email: "unverified@example.com",
        passwordHash: "hashed_password",
        status: "UNVERIFIED",
      });
      mockPasswordService.verifyPassword.mockResolvedValue(true);

      const dto = {
        email: "unverified@example.com",
        password: "SecurePassword123!",
      };

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });
  });
});
