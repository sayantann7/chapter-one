import { BadRequestException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { InterestRepository } from "../repositories/interest.repository";
import { InterestService } from "../services/interest.service";
import { ProfileService } from "../services/profile.service";

describe("InterestService", () => {
  let service: InterestService;
  let interestRepository: InterestRepository;

  const mockInterestRepository = {
    findAll: jest.fn(),
    findManyByIds: jest.fn(),
    replaceUserInterests: jest.fn(),
  };

  const mockProfileService = {
    getProfileForCurrentUser: jest
      .fn()
      .mockResolvedValue({ id: "p1", userId: "u1" }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterestService,
        { provide: InterestRepository, useValue: mockInterestRepository },
        { provide: ProfileService, useValue: mockProfileService },
      ],
    }).compile();

    service = module.get<InterestService>(InterestService);
    interestRepository = module.get<InterestRepository>(InterestRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getInterestsCatalog", () => {
    it("should return catalog grouped by category", async () => {
      mockInterestRepository.findAll.mockResolvedValue([
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
    it("should replace user interests when valid", async () => {
      mockInterestRepository.findManyByIds.mockResolvedValue([
        { id: "i1", name: "Hiking" },
        { id: "i2", name: "Camping" },
        { id: "i3", name: "Coding" },
      ]);
      const mockResult = [
        {
          profileId: "p1",
          interestId: "i1",
          interest: { id: "i1", name: "Hiking" },
        },
        {
          profileId: "p1",
          interestId: "i2",
          interest: { id: "i2", name: "Camping" },
        },
        {
          profileId: "p1",
          interestId: "i3",
          interest: { id: "i3", name: "Coding" },
        },
      ];
      mockInterestRepository.replaceUserInterests.mockResolvedValue(mockResult);

      const dto = { interestIds: ["i1", "i2", "i3"] };
      const res = await service.updateUserInterests("u1", dto);

      expect(interestRepository.findManyByIds).toHaveBeenCalledWith([
        "i1",
        "i2",
        "i3",
      ]);
      expect(interestRepository.replaceUserInterests).toHaveBeenCalledWith(
        "p1",
        ["i1", "i2", "i3"],
      );
      expect(res).toEqual(mockResult);
    });

    it("should throw BadRequestException for duplicate IDs", async () => {
      const dto = { interestIds: ["i1", "i1", "i2"] };
      await expect(service.updateUserInterests("u1", dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException for count bounds violation (<3)", async () => {
      const dto = { interestIds: ["i1", "i2"] };
      await expect(service.updateUserInterests("u1", dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException if one or more IDs do not exist in catalog", async () => {
      mockInterestRepository.findManyByIds.mockResolvedValue([
        { id: "i1" },
        { id: "i2" },
      ]); // missing i3

      const dto = { interestIds: ["i1", "i2", "non-existent"] };
      await expect(service.updateUserInterests("u1", dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
