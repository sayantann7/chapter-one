import { Test, TestingModule } from "@nestjs/testing";
import { ProfileController } from "../controllers/profile.controller";
import { ProfileService } from "../services/profile.service";

describe("ProfileController", () => {
  let controller: ProfileController;
  let profileService: ProfileService;

  const mockProfile = {
    id: "profile-uuid-123",
    userId: "user-uuid-123",
    firstName: "Alex",
    photos: [],
    voiceIntro: null,
    userInterests: [],
    prompts: [],
  };

  const mockProfileService = {
    getProfileForCurrentUser: jest.fn().mockResolvedValue(mockProfile),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [{ provide: ProfileService, useValue: mockProfileService }],
    }).compile();

    controller = module.get<ProfileController>(ProfileController);
    profileService = module.get<ProfileService>(ProfileService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("should call profileService.getProfileForCurrentUser and return formatted response", async () => {
    const res = await controller.getMyProfile("user-uuid-123");

    expect(profileService.getProfileForCurrentUser).toHaveBeenCalledWith(
      "user-uuid-123",
    );
    expect(res).toEqual({
      statusCode: 200,
      message: "Profile retrieved successfully",
      data: mockProfile,
    });
  });
});
