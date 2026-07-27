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
    createProfile: jest.fn().mockResolvedValue(mockProfile),
    updateMyProfile: jest
      .fn()
      .mockResolvedValue({ ...mockProfile, firstName: "Alex Updated" }),
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

  it("should call profileService.createProfile and return formatted response", async () => {
    const dto = { firstName: "Alex" };
    const res = await controller.createProfile("user-uuid-123", dto);

    expect(profileService.createProfile).toHaveBeenCalledWith(
      "user-uuid-123",
      dto,
    );
    expect(res).toEqual({
      statusCode: 201,
      message: "Profile created successfully",
      data: mockProfile,
    });
  });

  it("should call profileService.updateMyProfile and return formatted response", async () => {
    const dto = { firstName: "Alex Updated" };
    const res = await controller.updateMyProfile("user-uuid-123", dto);

    expect(profileService.updateMyProfile).toHaveBeenCalledWith(
      "user-uuid-123",
      dto,
    );
    expect(res).toEqual({
      statusCode: 200,
      message: "Profile updated successfully",
      data: { ...mockProfile, firstName: "Alex Updated" },
    });
  });
});
