import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../../prisma/prisma.service";
import { OnboardingService } from "../services/onboarding.service";

describe("OnboardingService", () => {
  let service: OnboardingService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<OnboardingService>(OnboardingService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getOnboardingStatus", () => {
    it("should return onboarding status and isCompleted: false for PENDING_ONBOARDING user", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: "user-uuid-123",
        status: "PENDING_ONBOARDING",
      });

      const result = await service.getOnboardingStatus("user-uuid-123");

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-uuid-123" },
      });
      expect(result).toEqual({
        userId: "user-uuid-123",
        status: "PENDING_ONBOARDING",
        isCompleted: false,
      });
    });

    it("should return isCompleted: true for ACTIVE user", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: "user-uuid-123",
        status: "ACTIVE",
      });

      const result = await service.getOnboardingStatus("user-uuid-123");

      expect(result).toEqual({
        userId: "user-uuid-123",
        status: "ACTIVE",
        isCompleted: true,
      });
    });

    it("should throw NotFoundException if user is not found", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getOnboardingStatus("unknown-id")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("completeOnboarding", () => {
    it("should transition status from PENDING_ONBOARDING to ACTIVE", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: "user-uuid-123",
        status: "PENDING_ONBOARDING",
      });
      mockPrismaService.user.update.mockResolvedValue({
        id: "user-uuid-123",
        status: "ACTIVE",
      });

      const result = await service.completeOnboarding("user-uuid-123");

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-uuid-123" },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-uuid-123" },
        data: { status: "ACTIVE" },
      });
      expect(result).toEqual({
        userId: "user-uuid-123",
        status: "ACTIVE",
        isCompleted: true,
      });
    });

    it("should return isCompleted: true if user is already ACTIVE", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: "user-uuid-123",
        status: "ACTIVE",
      });

      const result = await service.completeOnboarding("user-uuid-123");

      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(result).toEqual({
        userId: "user-uuid-123",
        status: "ACTIVE",
        isCompleted: true,
      });
    });

    it("should throw BadRequestException if user status is UNVERIFIED, SUSPENDED, or DEACTIVATED", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: "user-uuid-123",
        status: "UNVERIFIED",
      });

      await expect(service.completeOnboarding("user-uuid-123")).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
