import { Test, TestingModule } from "@nestjs/testing";
import { ProfileController } from "../controllers/profile.controller";
import { InterestService } from "../services/interest.service";
import { PhotoService } from "../services/photo.service";
import { PreferenceService } from "../services/preference.service";
import { ProfileService } from "../services/profile.service";
import { PromptService } from "../services/prompt.service";

describe("ProfileController", () => {
  let controller: ProfileController;
  let profileService: ProfileService;
  let photoService: PhotoService;
  let interestService: InterestService;
  let promptService: PromptService;
  let preferenceService: PreferenceService;

  const mockProfile = {
    id: "profile-uuid-123",
    userId: "user-uuid-123",
    firstName: "Alex",
    photos: [],
    voiceIntro: null,
    userInterests: [],
    prompts: [],
  };

  const mockPhoto = {
    id: "photo-uuid-1",
    profileId: "profile-uuid-123",
    url: "https://images.com/photo1.jpg",
    displayOrder: 0,
  };

  const mockCatalog = {
    Outdoors: [{ id: "i1", name: "Hiking", category: "Outdoors" }],
  };

  const mockUserInterests = [
    {
      profileId: "profile-uuid-123",
      interestId: "i1",
      interest: { id: "i1", name: "Hiking" },
    },
  ];

  const mockPromptCatalog = {
    Lifestyle: [{ id: "pr1", text: "Sunday text", category: "Lifestyle" }],
  };

  const mockUserPrompts = [
    {
      profileId: "profile-uuid-123",
      promptId: "pr1",
      answer: "Sample answer text",
      displayOrder: 0,
    },
  ];

  const mockPreferences = {
    profileId: "profile-uuid-123",
    minAge: 18,
    maxAge: 99,
    maxDistanceKm: 50,
    preferredGenders: [],
    preferredIntents: [],
  };

  const mockProfileService = {
    getProfileForCurrentUser: jest.fn().mockResolvedValue(mockProfile),
    createProfile: jest.fn().mockResolvedValue(mockProfile),
    updateMyProfile: jest
      .fn()
      .mockResolvedValue({ ...mockProfile, firstName: "Alex Updated" }),
  };

  const mockPhotoService = {
    addPhoto: jest.fn().mockResolvedValue(mockPhoto),
    deletePhoto: jest
      .fn()
      .mockResolvedValue({ message: "Photo deleted successfully" }),
    reorderPhotos: jest.fn().mockResolvedValue([mockPhoto]),
  };

  const mockInterestService = {
    getInterestsCatalog: jest.fn().mockResolvedValue(mockCatalog),
    updateUserInterests: jest.fn().mockResolvedValue(mockUserInterests),
  };

  const mockPromptService = {
    getPromptsCatalog: jest.fn().mockResolvedValue(mockPromptCatalog),
    updateUserPrompts: jest.fn().mockResolvedValue(mockUserPrompts),
  };

  const mockPreferenceService = {
    getPreferences: jest.fn().mockResolvedValue(mockPreferences),
    updatePreferences: jest
      .fn()
      .mockResolvedValue({ ...mockPreferences, minAge: 21, maxAge: 35 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        { provide: ProfileService, useValue: mockProfileService },
        { provide: PhotoService, useValue: mockPhotoService },
        { provide: InterestService, useValue: mockInterestService },
        { provide: PromptService, useValue: mockPromptService },
        { provide: PreferenceService, useValue: mockPreferenceService },
      ],
    }).compile();

    controller = module.get<ProfileController>(ProfileController);
    profileService = module.get<ProfileService>(ProfileService);
    photoService = module.get<PhotoService>(PhotoService);
    interestService = module.get<InterestService>(InterestService);
    promptService = module.get<PromptService>(PromptService);
    preferenceService = module.get<PreferenceService>(PreferenceService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("should call profileService.getMyProfile and return formatted response", async () => {
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

  it("should call photoService.addPhoto and return formatted response", async () => {
    const dto = { url: "https://images.com/photo1.jpg" };
    const res = await controller.addPhoto("user-uuid-123", dto);

    expect(photoService.addPhoto).toHaveBeenCalledWith("user-uuid-123", dto);
    expect(res).toEqual({
      statusCode: 201,
      message: "Photo added successfully",
      data: mockPhoto,
    });
  });

  it("should call photoService.deletePhoto and return formatted response", async () => {
    const res = await controller.deletePhoto("user-uuid-123", "photo-uuid-1");

    expect(photoService.deletePhoto).toHaveBeenCalledWith(
      "user-uuid-123",
      "photo-uuid-1",
    );
    expect(res).toEqual({
      statusCode: 200,
      message: "Photo deleted successfully",
    });
  });

  it("should call photoService.reorderPhotos and return formatted response", async () => {
    const dto = { photoIds: ["photo-uuid-1"] };
    const res = await controller.reorderPhotos("user-uuid-123", dto);

    expect(photoService.reorderPhotos).toHaveBeenCalledWith(
      "user-uuid-123",
      dto,
    );
    expect(res).toEqual({
      statusCode: 200,
      message: "Photos reordered successfully",
      data: [mockPhoto],
    });
  });

  it("should call interestService.getInterestsCatalog and return formatted response", async () => {
    const res = await controller.getInterestsCatalog();

    expect(interestService.getInterestsCatalog).toHaveBeenCalled();
    expect(res).toEqual({
      statusCode: 200,
      message: "Interest catalog retrieved successfully",
      data: mockCatalog,
    });
  });

  it("should call interestService.updateUserInterests and return formatted response", async () => {
    const dto = { interestIds: ["i1", "i2", "i3"] };
    const res = await controller.updateUserInterests("user-uuid-123", dto);

    expect(interestService.updateUserInterests).toHaveBeenCalledWith(
      "user-uuid-123",
      dto,
    );
    expect(res).toEqual({
      statusCode: 200,
      message: "User interests updated successfully",
      data: mockUserInterests,
    });
  });

  it("should call promptService.getPromptsCatalog and return formatted response", async () => {
    const res = await controller.getPromptsCatalog();

    expect(promptService.getPromptsCatalog).toHaveBeenCalled();
    expect(res).toEqual({
      statusCode: 200,
      message: "Prompt catalog retrieved successfully",
      data: mockPromptCatalog,
    });
  });

  it("should call promptService.updateUserPrompts and return formatted response", async () => {
    const dto = {
      prompts: [{ promptId: "pr1", answer: "Sample answer text" }],
    };
    const res = await controller.updateUserPrompts("user-uuid-123", dto);

    expect(promptService.updateUserPrompts).toHaveBeenCalledWith(
      "user-uuid-123",
      dto,
    );
    expect(res).toEqual({
      statusCode: 200,
      message: "User prompt responses updated successfully",
      data: mockUserPrompts,
    });
  });

  it("should call preferenceService.getPreferences and return formatted response", async () => {
    const res = await controller.getPreferences("user-uuid-123");

    expect(preferenceService.getPreferences).toHaveBeenCalledWith(
      "user-uuid-123",
    );
    expect(res).toEqual({
      statusCode: 200,
      message: "User preferences retrieved successfully",
      data: mockPreferences,
    });
  });

  it("should call preferenceService.updatePreferences and return formatted response", async () => {
    const dto = { minAge: 21, maxAge: 35 };
    const res = await controller.updatePreferences("user-uuid-123", dto);

    expect(preferenceService.updatePreferences).toHaveBeenCalledWith(
      "user-uuid-123",
      dto,
    );
    expect(res).toEqual({
      statusCode: 200,
      message: "User preferences updated successfully",
      data: { ...mockPreferences, minAge: 21, maxAge: 35 },
    });
  });
});
