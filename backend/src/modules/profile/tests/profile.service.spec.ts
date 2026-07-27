import { ConflictException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { ProfileRepository } from "../repositories/profile.repository";
import { ProfileService } from "../services/profile.service";

describe("ProfileService", () => {
  let service: ProfileService;
  let repository: ProfileRepository;

  const mockProfileRepository = {
    findByUserId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        { provide: ProfileRepository, useValue: mockProfileRepository },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
    repository = module.get<ProfileRepository>(ProfileRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getProfileByUserId", () => {
    it("should call profileRepository.findByUserId", async () => {
      const mockProfile = { id: "p1", userId: "u1", firstName: "Alex" };
      mockProfileRepository.findByUserId.mockResolvedValue(mockProfile);

      const res = await service.getProfileByUserId("u1");

      expect(repository.findByUserId).toHaveBeenCalledWith("u1");
      expect(res).toEqual(mockProfile);
    });
  });

  describe("getProfileForCurrentUser", () => {
    it("should return profile when found", async () => {
      const mockProfile = { id: "p1", userId: "u1", firstName: "Alex" };
      mockProfileRepository.findByUserId.mockResolvedValue(mockProfile);

      const res = await service.getProfileForCurrentUser("u1");

      expect(res).toEqual(mockProfile);
    });

    it("should throw NotFoundException when profile is not found", async () => {
      mockProfileRepository.findByUserId.mockResolvedValue(null);

      await expect(
        service.getProfileForCurrentUser("unknown-u1"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("createProfile", () => {
    it("should create profile when non-existent", async () => {
      mockProfileRepository.findByUserId.mockResolvedValue(null);
      const created = { id: "p1", userId: "u1", firstName: "Alex" };
      mockProfileRepository.create.mockResolvedValue(created);

      const dto = { firstName: "Alex" };
      const res = await service.createProfile("u1", dto);

      expect(repository.create).toHaveBeenCalled();
      expect(res).toEqual(created);
    });

    it("should throw ConflictException if profile already exists", async () => {
      mockProfileRepository.findByUserId.mockResolvedValue({ id: "existing" });

      await expect(
        service.createProfile("u1", { firstName: "Alex" }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("updateMyProfile", () => {
    it("should update profile when exists", async () => {
      mockProfileRepository.findByUserId.mockResolvedValue({
        id: "existing",
        userId: "u1",
      });
      const updated = {
        id: "existing",
        userId: "u1",
        firstName: "Alex Updated",
      };
      mockProfileRepository.update.mockResolvedValue(updated);

      const dto = { firstName: "Alex Updated" };
      const res = await service.updateMyProfile("u1", dto);

      expect(repository.update).toHaveBeenCalled();
      expect(res).toEqual(updated);
    });

    it("should throw NotFoundException if updating non-existent profile", async () => {
      mockProfileRepository.findByUserId.mockResolvedValue(null);

      await expect(
        service.updateMyProfile("unknown-id", { firstName: "Alex" }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
