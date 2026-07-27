import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../../prisma/prisma.service";
import { ProfileService } from "../services/profile.service";

describe("ProfileService", () => {
  let service: ProfileService;
  let prisma: PrismaService;

  const mockPrismaService = {
    profile: {
      findUnique: jest.fn(),
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
});
