import { Test, TestingModule } from "@nestjs/testing";
import { PhotoRepository } from "../repositories/photo.repository";
import { PreferenceService } from "../services/preference.service";
import { ProfileCompletionService } from "../services/profile-completion.service";
import { ProfileService } from "../services/profile.service";

describe("ProfileCompletionService", () => {
  let service: ProfileCompletionService;

  const mockProfileService = {
    getProfileForCurrentUser: jest.fn(),
  };

  const mockPhotoRepository = {
    countByProfileId: jest.fn(),
  };

  const mockPreferenceService = {
    getPreferences: jest.fn().mockResolvedValue({ minAge: 18, maxAge: 99 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileCompletionService,
        { provide: ProfileService, useValue: mockProfileService },
        { provide: PhotoRepository, useValue: mockPhotoRepository },
        { provide: PreferenceService, useValue: mockPreferenceService },
      ],
    }).compile();

    service = module.get<ProfileCompletionService>(ProfileCompletionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should evaluate partial profile (only basic profile complete) -> 40%", async () => {
    mockProfileService.getProfileForCurrentUser.mockResolvedValue({
      id: "p1",
      userId: "u1",
      firstName: "Alex",
      birthdate: new Date("1995-05-15"),
      gender: "MALE",
      bio: "Hello world",
      photos: [],
      userInterests: [],
      prompts: [],
    });

    const res = await service.getProfileCompletion("u1");

    expect(res).toEqual({
      percentage: 40, // basic_profile (20%) + preferences (20%)
      isComplete: false,
      completedSections: ["basic_profile", "preferences"],
      missingSections: ["photos", "interests", "prompts"],
    });
  });

  it("should evaluate fully complete profile -> 100%", async () => {
    mockProfileService.getProfileForCurrentUser.mockResolvedValue({
      id: "p1",
      userId: "u1",
      firstName: "Alex",
      birthdate: new Date("1995-05-15"),
      gender: "MALE",
      bio: "Hello world",
      photos: [{ id: "ph1" }, { id: "ph2" }],
      userInterests: [{ id: "i1" }, { id: "i2" }, { id: "i3" }],
      prompts: [{ id: "pr1" }],
    });

    const res = await service.getProfileCompletion("u1");

    expect(res).toEqual({
      percentage: 100,
      isComplete: true,
      completedSections: [
        "basic_profile",
        "photos",
        "interests",
        "prompts",
        "preferences",
      ],
      missingSections: [],
    });
  });

  it("should evaluate empty/incomplete basic profile -> 20% (only preferences complete)", async () => {
    mockProfileService.getProfileForCurrentUser.mockResolvedValue({
      id: "p1",
      userId: "u1",
      firstName: "Alex",
      birthdate: null, // missing birthdate
      gender: null,
      bio: "",
      photos: [],
      userInterests: [],
      prompts: [],
    });

    const res = await service.getProfileCompletion("u1");

    expect(res).toEqual({
      percentage: 20, // only preferences (20%)
      isComplete: false,
      completedSections: ["preferences"],
      missingSections: ["basic_profile", "photos", "interests", "prompts"],
    });
  });
});
