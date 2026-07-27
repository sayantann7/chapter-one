import { BadRequestException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PreferenceRepository } from "../repositories/preference.repository";
import { PreferenceService } from "../services/preference.service";
import { ProfileService } from "../services/profile.service";

describe("PreferenceService", () => {
  let service: PreferenceService;
  let preferenceRepository: PreferenceRepository;

  const mockPreferenceRepository = {
    findByUserId: jest.fn(),
    upsert: jest.fn(),
  };

  const mockProfileService = {
    getProfileForCurrentUser: jest
      .fn()
      .mockResolvedValue({ id: "p1", userId: "u1" }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PreferenceService,
        { provide: PreferenceRepository, useValue: mockPreferenceRepository },
        { provide: ProfileService, useValue: mockProfileService },
      ],
    }).compile();

    service = module.get<PreferenceService>(PreferenceService);
    preferenceRepository =
      module.get<PreferenceRepository>(PreferenceRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getPreferences", () => {
    it("should return sensible default preferences when no DB record exists", async () => {
      mockPreferenceRepository.findByUserId.mockResolvedValue(null);

      const res = await service.getPreferences("u1");

      expect(preferenceRepository.findByUserId).toHaveBeenCalledWith("u1");
      expect(res).toEqual({
        userId: "u1",
        minAge: 18,
        maxAge: 99,
        maxDistanceKm: 50,
        preferredGenders: [],
        preferredIntents: [],
      });
    });

    it("should return existing preferences when DB record exists", async () => {
      const mockRecord = {
        userId: "u1",
        minAge: 21,
        maxAge: 35,
        maxDistanceKm: 25,
      };
      mockPreferenceRepository.findByUserId.mockResolvedValue(mockRecord);

      const res = await service.getPreferences("u1");

      expect(res).toEqual(mockRecord);
    });
  });

  describe("updatePreferences", () => {
    it("should update preferences when age range is valid", async () => {
      mockPreferenceRepository.findByUserId.mockResolvedValue(null);
      const mockUpdated = { userId: "u1", minAge: 22, maxAge: 30 };
      mockPreferenceRepository.upsert.mockResolvedValue(mockUpdated);

      const dto = { minAge: 22, maxAge: 30 };
      const res = await service.updatePreferences("u1", dto);

      expect(preferenceRepository.upsert).toHaveBeenCalledWith("u1", dto);
      expect(res).toEqual(mockUpdated);
    });

    it("should throw BadRequestException when minAge > maxAge", async () => {
      mockPreferenceRepository.findByUserId.mockResolvedValue(null);

      const dto = { minAge: 40, maxAge: 25 };
      await expect(service.updatePreferences("u1", dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
