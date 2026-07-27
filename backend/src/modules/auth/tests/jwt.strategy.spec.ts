import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../../prisma/prisma.service";
import { JwtStrategy } from "../strategies/jwt.strategy";

describe("JwtStrategy", () => {
  let strategy: JwtStrategy;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      if (key === "JWT_SECRET") return "chapter-one-super-secret-jwt-key-2026";
      if (key === "JWT_ISSUER") return "chapter-one-auth";
      if (key === "JWT_AUDIENCE") return "chapter-one-api";
      return defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(strategy).toBeDefined();
  });

  it("should validate and return user without passwordHash for valid payload", async () => {
    const payload = {
      sub: "user-uuid-123",
      email: "alex@example.com",
      status: "VERIFIED",
      role: "USER",
    };

    const mockUser = {
      id: "user-uuid-123",
      email: "alex@example.com",
      passwordHash: "hashed_password",
      status: "VERIFIED",
      role: "USER",
      deletedAt: null,
    };

    mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

    const result = await strategy.validate(payload);

    expect(prismaService.user.findUnique).toHaveBeenCalledWith({
      where: { id: payload.sub },
    });
    expect(result).toEqual({
      id: "user-uuid-123",
      email: "alex@example.com",
      status: "VERIFIED",
      role: "USER",
      deletedAt: null,
    });
    expect(result).not.toHaveProperty("passwordHash");
  });

  it("should throw UnauthorizedException if payload is invalid or missing sub", async () => {
    await expect(strategy.validate({} as any)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("should throw UnauthorizedException if user does not exist in database", async () => {
    mockPrismaService.user.findUnique.mockResolvedValue(null);

    await expect(
      strategy.validate({ sub: "non-existent-id" } as any),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("should throw UnauthorizedException if user has been soft-deleted (deletedAt !== null)", async () => {
    const deletedUser = {
      id: "user-uuid-123",
      email: "deleted@example.com",
      passwordHash: "hashed",
      deletedAt: new Date(),
    };

    mockPrismaService.user.findUnique.mockResolvedValue(deletedUser);

    await expect(
      strategy.validate({ sub: "user-uuid-123" } as any),
    ).rejects.toThrow(UnauthorizedException);
  });
});
