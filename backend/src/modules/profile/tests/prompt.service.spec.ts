import { BadRequestException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PromptRepository } from "../repositories/prompt.repository";
import { ProfileService } from "../services/profile.service";
import { PromptService } from "../services/prompt.service";

describe("PromptService", () => {
  let service: PromptService;
  let promptRepository: PromptRepository;

  const mockPromptRepository = {
    findAll: jest.fn(),
    findManyByIds: jest.fn(),
    replaceUserPrompts: jest.fn(),
  };

  const mockProfileService = {
    getProfileForCurrentUser: jest
      .fn()
      .mockResolvedValue({ id: "p1", userId: "u1" }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromptService,
        { provide: PromptRepository, useValue: mockPromptRepository },
        { provide: ProfileService, useValue: mockProfileService },
      ],
    }).compile();

    service = module.get<PromptService>(PromptService);
    promptRepository = module.get<PromptRepository>(PromptRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getPromptsCatalog", () => {
    it("should return catalog grouped by category", async () => {
      mockPromptRepository.findAll.mockResolvedValue([
        { id: "pr1", text: "Sunday text", category: "Lifestyle" },
        { id: "pr2", text: "Romance text", category: "Romance" },
      ]);

      const res = await service.getPromptsCatalog();

      expect(res).toEqual({
        Lifestyle: [{ id: "pr1", text: "Sunday text", category: "Lifestyle" }],
        Romance: [{ id: "pr2", text: "Romance text", category: "Romance" }],
      });
    });
  });

  describe("updateUserPrompts", () => {
    it("should replace user prompt responses when valid", async () => {
      mockPromptRepository.findManyByIds.mockResolvedValue([
        { id: "pr1", text: "Sunday text" },
      ]);
      const mockResult = [
        {
          profileId: "p1",
          promptId: "pr1",
          answer: "My long answer text",
          displayOrder: 0,
        },
      ];
      mockPromptRepository.replaceUserPrompts.mockResolvedValue(mockResult);

      const dto = {
        prompts: [{ promptId: "pr1", answer: "My long answer text" }],
      };
      const res = await service.updateUserPrompts("u1", dto);

      expect(promptRepository.findManyByIds).toHaveBeenCalledWith(["pr1"]);
      expect(promptRepository.replaceUserPrompts).toHaveBeenCalledWith(
        "p1",
        dto.prompts,
      );
      expect(res).toEqual(mockResult);
    });

    it("should throw BadRequestException for duplicate prompt IDs", async () => {
      const dto = {
        prompts: [
          { promptId: "pr1", answer: "Answer 1" },
          { promptId: "pr1", answer: "Answer 2" },
        ],
      };
      await expect(service.updateUserPrompts("u1", dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException for count bounds violation (>3)", async () => {
      const dto = {
        prompts: [
          { promptId: "pr1", answer: "Answer 1" },
          { promptId: "pr2", answer: "Answer 2" },
          { promptId: "pr3", answer: "Answer 3" },
          { promptId: "pr4", answer: "Answer 4" },
        ],
      };
      await expect(service.updateUserPrompts("u1", dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException if one or more prompt IDs do not exist in catalog", async () => {
      mockPromptRepository.findManyByIds.mockResolvedValue([]); // missing pr1

      const dto = { prompts: [{ promptId: "pr1", answer: "Answer 1" }] };
      await expect(service.updateUserPrompts("u1", dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
