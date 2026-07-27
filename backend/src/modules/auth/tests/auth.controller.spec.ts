import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "../controllers/auth.controller";
import { AuthService } from "../services/auth.service";

describe("AuthController", () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn().mockResolvedValue({
      userId: "user-uuid-123",
      status: "UNVERIFIED",
      verificationExpiresInSeconds: 900,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("should call authService.register and return formatted response", async () => {
    const dto = {
      email: "test@example.com",
      password: "SecurePassword123!",
    };

    const res = await controller.register(dto);

    expect(authService.register).toHaveBeenCalledWith(dto);
    expect(res).toEqual({
      statusCode: 201,
      message: "Registration successful. Verification code sent.",
      data: {
        userId: "user-uuid-123",
        status: "UNVERIFIED",
        verificationExpiresInSeconds: 900,
      },
    });
  });
});
