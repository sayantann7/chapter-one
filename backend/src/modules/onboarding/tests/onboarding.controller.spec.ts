import { Test, TestingModule } from "@nestjs/testing";
import { OnboardingController } from "../controllers/onboarding.controller";
import { OnboardingService } from "../services/onboarding.service";

describe("OnboardingController", () => {
  let controller: OnboardingController;
  let onboardingService: OnboardingService;

  const mockOnboardingService = {
    getOnboardingStatus: jest.fn().mockResolvedValue({
      userId: "user-uuid-123",
      status: "PENDING_ONBOARDING",
      isCompleted: false,
    }),
    completeOnboarding: jest.fn().mockResolvedValue({
      userId: "user-uuid-123",
      status: "ACTIVE",
      isCompleted: true,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OnboardingController],
      providers: [
        { provide: OnboardingService, useValue: mockOnboardingService },
      ],
    }).compile();

    controller = module.get<OnboardingController>(OnboardingController);
    onboardingService = module.get<OnboardingService>(OnboardingService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("should call onboardingService.getOnboardingStatus and return formatted response", async () => {
    const res = await controller.getStatus("user-uuid-123");

    expect(onboardingService.getOnboardingStatus).toHaveBeenCalledWith(
      "user-uuid-123",
    );
    expect(res).toEqual({
      statusCode: 200,
      message: "Onboarding status retrieved",
      data: {
        userId: "user-uuid-123",
        status: "PENDING_ONBOARDING",
        isCompleted: false,
      },
    });
  });

  it("should call onboardingService.completeOnboarding and return formatted response", async () => {
    const res = await controller.complete("user-uuid-123");

    expect(onboardingService.completeOnboarding).toHaveBeenCalledWith(
      "user-uuid-123",
    );
    expect(res).toEqual({
      statusCode: 200,
      message: "Onboarding completed successfully",
      data: {
        userId: "user-uuid-123",
        status: "ACTIVE",
        isCompleted: true,
      },
    });
  });
});
