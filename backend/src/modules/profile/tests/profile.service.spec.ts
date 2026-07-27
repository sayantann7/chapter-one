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
    interest: {
      findMany: jest.fn(),
      createMany: jest.fn(),
    },
    profileInterest: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
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

  describe("getInterestsCatalog", () => {
    it("should return catalog grouped by category", async () => {
      mockPrismaService.interest.findMany.mockResolvedValue([
        { id: "i1", name: "Hiking", category: "Outdoors" },
        { id: "i2", name: "Camping", category: "Outdoors" },
        { id: "i3", name: "Coding", category: "Tech" },
      ]);

      const res = await service.getInterestsCatalog();

      expect(res).toEqual({
        Outdoors: [
          { id: "i1", name: "Hiking", category: "Outdoors" },
          { id: "i2", name: "Camping", category: "Outdoors" },
        ],
        Tech: [{ id: "i3", name: "Coding", category: "Tech" }],
      });
    });
  });

  describe("updateUserInterests", () => {
    it("should replace user interests atomically when valid", async () => {
      mockPrismaService.profile.findUnique.mockResolvedValue({
        id: "profile-uuid-123",
        userId: "user-uuid-123",
      });
      mockPrismaService.interest.findMany.mockResolvedValue([
        { id: "i1", name: "Hiking" },
        { id: "i2", name: "Camping" },
        { id: "i3", name: "Coding" },
      ]);
      const mockResult = [
        {
          profileId: "profile-uuid-123",
          interestId: "i1",
          interest: { id: "i1", name: "Hiking" },
        },
        {
          profileId: "profile-uuid-123",
          interestId: "i2",
          interest: { id: "i2", name: "Camping" },
        },
        {
          profileId: "profile-uuid-123",
          interestId: "i3",
          interest: { id: "i3", name: "Coding" },
        },
      ];
      mockPrismaService.profileInterest.findMany.mockResolvedValue(mockResult);

      const dto = { interestIds: ["i1", "i2", "i3"] };
      const res = await service.updateUserInterests("user-uuid-123", dto);

      expect(prisma.profileInterest.deleteMany).toHaveBeenCalledWith({
        where: { profileId: "profile-uuid-123" },
      });
      expect(prisma.profileInterest.createMany).toHaveBeenCalledWith({
        data: [
          { profileId: "profile-uuid-123", interestId: "i1" },
          { profileId: "profile-uuid-123", interestId: "i2" },
          { profileId: "profile-uuid-123", interestId: "i3" },
        ],
      });
      expect(res).toEqual(mockResult);
    });

    it("should throw BadRequestException for duplicate interest IDs", async () => {
      mockPrismaService.profile.findUnique.mockResolvedValue({
        id: "profile-uuid-123",
        userId: "user-uuid-123",
      });

      const dto = { interestIds: ["i1", "i1", "i2"] };
      await expect(
        service.updateUserInterests("user-uuid-123", dto),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException if selection contains less than 3 items", async () => {
      mockPrismaService.profile.findUnique.mockResolvedValue({
        id: "profile-uuid-123",
        userId: "user-uuid-123",
      });

      const dto = { interestIds: ["i1", "i2"] };
      await expect(
        service.updateUserInterests("user-uuid-123", dto),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException if one or more interest IDs do not exist in catalog", async () => {
      mockPrismaService.profile.findUnique.mockResolvedValue({
        id: "profile-uuid-123",
        userId: "user-uuid-123",
      });
      mockPrismaService.interest.findMany.mockResolvedValue([
        { id: "i1" },
        { id: "i2" },
      ]); // missing i3

      const dto = { interestIds: ["i1", "i2", "non-existent-id"] };
      await expect(
        service.updateUserInterests("user-uuid-123", dto),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
