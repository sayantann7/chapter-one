import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../../prisma/prisma.service";
import { ProfileService } from "../services/profile.service";

describe("ProfileService", () => {
  let service: ProfileService;
  let prisma: PrismaService;

  const mockPrismaService = {
    $transaction: jest.fn((cb) => cb(mockPrismaService)),
    profile: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    profilePhoto: {
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
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

  describe("addPhoto", () => {
    it("should add photo with auto display order when under limit", async () => {
      mockPrismaService.profile.findUnique.mockResolvedValue({
        id: "profile-uuid-123",
        userId: "user-uuid-123",
      });
      mockPrismaService.profilePhoto.count.mockResolvedValue(2);
      const createdPhoto = {
        id: "photo-uuid-3",
        profileId: "profile-uuid-123",
        url: "https://img.com/3.jpg",
        displayOrder: 2,
      };
      mockPrismaService.profilePhoto.create.mockResolvedValue(createdPhoto);

      const dto = { url: "https://img.com/3.jpg" };
      const result = await service.addPhoto("user-uuid-123", dto);

      expect(prisma.profilePhoto.create).toHaveBeenCalledWith({
        data: {
          profileId: "profile-uuid-123",
          url: "https://img.com/3.jpg",
          thumbnailUrl: undefined,
          blurHash: undefined,
          displayOrder: 2,
        },
      });
      expect(result).toEqual(createdPhoto);
    });

    it("should throw BadRequestException if max 6 photos limit is reached", async () => {
      mockPrismaService.profile.findUnique.mockResolvedValue({
        id: "profile-uuid-123",
        userId: "user-uuid-123",
      });
      mockPrismaService.profilePhoto.count.mockResolvedValue(6);

      const dto = { url: "https://img.com/7.jpg" };
      await expect(service.addPhoto("user-uuid-123", dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("deletePhoto", () => {
    it("should delete photo and reorder remaining photos", async () => {
      mockPrismaService.profile.findUnique.mockResolvedValue({
        id: "profile-uuid-123",
        userId: "user-uuid-123",
      });
      mockPrismaService.profilePhoto.findUnique.mockResolvedValue({
        id: "photo-uuid-1",
        profileId: "profile-uuid-123",
      });
      mockPrismaService.profilePhoto.delete.mockResolvedValue({
        id: "photo-uuid-1",
      });
      mockPrismaService.profilePhoto.findMany.mockResolvedValue([
        { id: "photo-uuid-2", displayOrder: 1 },
      ]);
      mockPrismaService.profilePhoto.update.mockResolvedValue({
        id: "photo-uuid-2",
        displayOrder: 0,
      });

      const res = await service.deletePhoto("user-uuid-123", "photo-uuid-1");

      expect(prisma.profilePhoto.delete).toHaveBeenCalledWith({
        where: { id: "photo-uuid-1" },
      });
      expect(prisma.profilePhoto.update).toHaveBeenCalled();
      expect(res).toEqual({ message: "Photo deleted successfully" });
    });

    it("should throw NotFoundException if photo not owned by user", async () => {
      mockPrismaService.profile.findUnique.mockResolvedValue({
        id: "profile-uuid-123",
        userId: "user-uuid-123",
      });
      mockPrismaService.profilePhoto.findUnique.mockResolvedValue({
        id: "photo-uuid-1",
        profileId: "other-profile-id",
      });

      await expect(
        service.deletePhoto("user-uuid-123", "photo-uuid-1"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("reorderPhotos", () => {
    it("should update displayOrder for all photos in array", async () => {
      mockPrismaService.profile.findUnique.mockResolvedValue({
        id: "profile-uuid-123",
        userId: "user-uuid-123",
      });
      mockPrismaService.profilePhoto.findMany
        .mockResolvedValueOnce([
          { id: "photo-1", displayOrder: 0 },
          { id: "photo-2", displayOrder: 1 },
        ])
        .mockResolvedValueOnce([
          { id: "photo-2", displayOrder: 0 },
          { id: "photo-1", displayOrder: 1 },
        ]);

      const dto = { photoIds: ["photo-2", "photo-1"] };
      const res = await service.reorderPhotos("user-uuid-123", dto);

      expect(prisma.profilePhoto.update).toHaveBeenCalled();
      expect(res).toEqual([
        { id: "photo-2", displayOrder: 0 },
        { id: "photo-1", displayOrder: 1 },
      ]);
    });

    it("should throw BadRequestException if photo IDs do not match profile photos", async () => {
      mockPrismaService.profile.findUnique.mockResolvedValue({
        id: "profile-uuid-123",
        userId: "user-uuid-123",
      });
      mockPrismaService.profilePhoto.findMany.mockResolvedValue([
        { id: "photo-1", displayOrder: 0 },
      ]);

      const dto = { photoIds: ["photo-unowned"] };
      await expect(service.reorderPhotos("user-uuid-123", dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
