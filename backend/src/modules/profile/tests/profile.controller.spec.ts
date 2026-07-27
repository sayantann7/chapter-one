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

  const mockProfileService = {
    getProfileForCurrentUser: jest.fn().mockResolvedValue(mockProfile),
    createProfile: jest.fn().mockResolvedValue(mockProfile),
    updateMyProfile: jest
      .fn()
      .mockResolvedValue({ ...mockProfile, firstName: "Alex Updated" }),
    addPhoto: jest.fn().mockResolvedValue(mockPhoto),
    deletePhoto: jest
      .fn()
      .mockResolvedValue({ message: "Photo deleted successfully" }),
    reorderPhotos: jest.fn().mockResolvedValue([mockPhoto]),
    getInterestsCatalog: jest.fn().mockResolvedValue(mockCatalog),
    updateUserInterests: jest.fn().mockResolvedValue(mockUserInterests),
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

  it("should call profileService.addPhoto and return formatted response", async () => {
    const dto = { url: "https://images.com/photo1.jpg" };
    const res = await controller.addPhoto("user-uuid-123", dto);

    expect(profileService.addPhoto).toHaveBeenCalledWith("user-uuid-123", dto);
    expect(res).toEqual({
      statusCode: 201,
      message: "Photo added successfully",
      data: mockPhoto,
    });
  });

  it("should call profileService.deletePhoto and return formatted response", async () => {
    const res = await controller.deletePhoto("user-uuid-123", "photo-uuid-1");

    expect(profileService.deletePhoto).toHaveBeenCalledWith(
      "user-uuid-123",
      "photo-uuid-1",
    );
    expect(res).toEqual({
      statusCode: 200,
      message: "Photo deleted successfully",
    });
  });

  it("should call profileService.reorderPhotos and return formatted response", async () => {
    const dto = { photoIds: ["photo-uuid-1"] };
    const res = await controller.reorderPhotos("user-uuid-123", dto);

    expect(profileService.reorderPhotos).toHaveBeenCalledWith(
      "user-uuid-123",
      dto,
    );
    expect(res).toEqual({
      statusCode: 200,
      message: "Photos reordered successfully",
      data: [mockPhoto],
    });
  });

  it("should call profileService.getInterestsCatalog and return formatted response", async () => {
    const res = await controller.getInterestsCatalog();

    expect(profileService.getInterestsCatalog).toHaveBeenCalled();
    expect(res).toEqual({
      statusCode: 200,
      message: "Interest catalog retrieved successfully",
      data: mockCatalog,
    });
  });

  it("should call profileService.updateUserInterests and return formatted response", async () => {
    const dto = { interestIds: ["i1", "i2", "i3"] };
    const res = await controller.updateUserInterests("user-uuid-123", dto);

    expect(profileService.updateUserInterests).toHaveBeenCalledWith(
      "user-uuid-123",
      dto,
    );
    expect(res).toEqual({
      statusCode: 200,
      message: "User interests updated successfully",
      data: mockUserInterests,
    });
  });
});
