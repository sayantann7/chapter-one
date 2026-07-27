import { ConflictException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../../prisma/prisma.service";
import { ProfileService } from "../services/profile.service";

describe("ProfileService", () => {
  let service: ProfileService;
  let prisma: PrismaService;

  const mockPrismaService = {
    profile: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getProfileByUserId", () => {
    it("should query Prisma with user id and include relations", async () => {
      const mockProfile = {
        id: "profile-uuid-123",
        userId: "user-uuid-123",
        firstName: "Alex",
        photos: [],
        voiceIntro: null,
        userInterests: [],
        prompts: [],
      };
      mockPrismaService.profile.findUnique.mockResolvedValue(mockProfile);

      const result = await service.getProfileByUserId("user-uuid-123");

      expect(prisma.profile.findUnique).toHaveBeenCalledWith({
        where: { userId: "user-uuid-123" },
        include: {
          photos: { orderBy: { displayOrder: "asc" } },
          voiceIntro: true,
          userInterests: { include: { interest: true } },
          prompts: {
            include: { prompt: true },
            orderBy: { displayOrder: "asc" },
          },
        },
      });
      expect(result).toEqual(mockProfile);
    });
  });

  describe("getProfileForCurrentUser", () => {
    it("should return profile when found", async () => {
      const mockProfile = {
        id: "profile-uuid-123",
        userId: "user-uuid-123",
        firstName: "Alex",
      };
      mockPrismaService.profile.findUnique.mockResolvedValue(mockProfile);

      const result = await service.getProfileForCurrentUser("user-uuid-123");

      expect(result).toEqual(mockProfile);
    });

    it("should throw NotFoundException when profile is not found", async () => {
      mockPrismaService.profile.findUnique.mockResolvedValue(null);

      await expect(
        service.getProfileForCurrentUser("unknown-user-id"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("createProfile", () => {
    it("should create profile when non-existent", async () => {
      mockPrismaService.profile.findUnique.mockResolvedValue(null);
      const createdProfile = {
        id: "profile-uuid-123",
        userId: "user-uuid-123",
        firstName: "Alex",
        bio: "Hello world",
      };
      mockPrismaService.profile.create.mockResolvedValue(createdProfile);

      const dto = { firstName: "Alex", bio: "Hello world" };
      const result = await service.createProfile("user-uuid-123", dto);

      expect(prisma.profile.create).toHaveBeenCalled();
      expect(result).toEqual(createdProfile);
    });

    it("should throw ConflictException if profile already exists", async () => {
      mockPrismaService.profile.findUnique.mockResolvedValue({
        id: "existing-id",
      });

      await expect(
        service.createProfile("user-uuid-123", { firstName: "Alex" }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("updateMyProfile", () => {
    it("should update profile when exists", async () => {
      mockPrismaService.profile.findUnique.mockResolvedValue({
        id: "existing-id",
        userId: "user-uuid-123",
      });
      const updatedProfile = {
        id: "existing-id",
        userId: "user-uuid-123",
        firstName: "Alex Updated",
      };
      mockPrismaService.profile.update.mockResolvedValue(updatedProfile);

      const dto = { firstName: "Alex Updated" };
      const result = await service.updateMyProfile("user-uuid-123", dto);

      expect(prisma.profile.update).toHaveBeenCalled();
      expect(result).toEqual(updatedProfile);
    });

    it("should throw NotFoundException if updating non-existent profile", async () => {
      mockPrismaService.profile.findUnique.mockResolvedValue(null);

      await expect(
        service.updateMyProfile("unknown-id", { firstName: "Alex" }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
