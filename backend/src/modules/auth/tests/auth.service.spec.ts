import { ConflictException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../../prisma/prisma.service";
import { AuthService } from "../services/auth.service";
import { PasswordService } from "../services/password.service";
import { VerificationService } from "../services/verification.service";

describe("AuthService", () => {
  let service: AuthService;
  let prisma: PrismaService;
  let passwordService: PasswordService;
  let verificationService: VerificationService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockPasswordService = {
    hashPassword: jest.fn().mockResolvedValue("hashed_argon2id_password"),
  };

  const mockVerificationService = {
    generateVerificationCode: jest.fn().mockReturnValue("654321"),
    storeVerificationCode: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PasswordService, useValue: mockPasswordService },
        { provide: VerificationService, useValue: mockVerificationService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    passwordService = module.get<PasswordService>(PasswordService);
    verificationService = module.get<VerificationService>(VerificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

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
