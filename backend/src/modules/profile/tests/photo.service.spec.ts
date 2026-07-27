import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PhotoRepository } from "../repositories/photo.repository";
import { PhotoService } from "../services/photo.service";
import { ProfileService } from "../services/profile.service";

describe("PhotoService", () => {
  let service: PhotoService;
  let photoRepository: PhotoRepository;

  const mockPhotoRepository = {
    countByProfileId: jest.fn(),
    findById: jest.fn(),
    findManyByProfileId: jest.fn(),
    create: jest.fn(),
    deleteAndReorder: jest.fn(),
    reorderPhotos: jest.fn(),
  };

  const mockProfileService = {
    getProfileForCurrentUser: jest
      .fn()
      .mockResolvedValue({ id: "p1", userId: "u1" }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhotoService,
        { provide: PhotoRepository, useValue: mockPhotoRepository },
        { provide: ProfileService, useValue: mockProfileService },
      ],
    }).compile();

    service = module.get<PhotoService>(PhotoService);
    photoRepository = module.get<PhotoRepository>(PhotoRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("addPhoto", () => {
    it("should add photo when under max 6 limit", async () => {
      mockPhotoRepository.countByProfileId.mockResolvedValue(2);
      const mockCreated = { id: "ph-3", profileId: "p1", displayOrder: 2 };
      mockPhotoRepository.create.mockResolvedValue(mockCreated);

      const dto = { url: "https://img.com/3.jpg" };
      const res = await service.addPhoto("u1", dto);

      expect(photoRepository.countByProfileId).toHaveBeenCalledWith("p1");
      expect(photoRepository.create).toHaveBeenCalledWith("p1", dto, 2);
      expect(res).toEqual(mockCreated);
    });

    it("should throw BadRequestException if max 6 limit is reached", async () => {
      mockPhotoRepository.countByProfileId.mockResolvedValue(6);

      await expect(
        service.addPhoto("u1", { url: "https://img.com/7.jpg" }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("deletePhoto", () => {
    it("should delete photo when owned by user profile", async () => {
      mockPhotoRepository.findById.mockResolvedValue({
        id: "ph-1",
        profileId: "p1",
      });
      mockPhotoRepository.deleteAndReorder.mockResolvedValue(undefined);

      const res = await service.deletePhoto("u1", "ph-1");

      expect(photoRepository.deleteAndReorder).toHaveBeenCalledWith(
        "p1",
        "ph-1",
      );
      expect(res).toEqual({ message: "Photo deleted successfully" });
    });

    it("should throw NotFoundException if photo is missing or owned by another user", async () => {
      mockPhotoRepository.findById.mockResolvedValue({
        id: "ph-1",
        profileId: "other-profile",
      });

      await expect(service.deletePhoto("u1", "ph-1")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("reorderPhotos", () => {
    it("should reorder photos when valid IDs provided", async () => {
      mockPhotoRepository.findManyByProfileId.mockResolvedValue([
        { id: "ph-1", displayOrder: 0 },
        { id: "ph-2", displayOrder: 1 },
      ]);
      const mockReordered = [
        { id: "ph-2", displayOrder: 0 },
        { id: "ph-1", displayOrder: 1 },
      ];
      mockPhotoRepository.reorderPhotos.mockResolvedValue(mockReordered);

      const dto = { photoIds: ["ph-2", "ph-1"] };
      const res = await service.reorderPhotos("u1", dto);

      expect(photoRepository.reorderPhotos).toHaveBeenCalledWith("p1", [
        "ph-2",
        "ph-1",
      ]);
      expect(res).toEqual(mockReordered);
    });

    it("should throw BadRequestException if unowned photo ID included", async () => {
      mockPhotoRepository.findManyByProfileId.mockResolvedValue([
        { id: "ph-1", displayOrder: 0 },
      ]);

      await expect(
        service.reorderPhotos("u1", { photoIds: ["ph-unowned"] }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
