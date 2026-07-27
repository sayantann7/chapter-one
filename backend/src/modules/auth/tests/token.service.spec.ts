import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import { RedisService } from "../../../redis/redis.service";
import { TokenService } from "../services/token.service";

describe("TokenService", () => {
  let service: TokenService;
  let jwtService: JwtService;
  let redisService: RedisService;

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue("mocked_access_token"),
  };

  const mockRedisService = {
    set: jest.fn().mockResolvedValue("OK"),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
    jwtService = module.get<JwtService>(JwtService);
    redisService = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should generate an access token with expected payload claims", async () => {
    const user = {
      id: "user-uuid-123",
      email: "alex@example.com",
      status: "VERIFIED",
      role: "USER",
    };

    const token = await service.generateAccessToken(user);

    expect(jwtService.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: user.id,
        email: user.email,
        status: user.status,
        role: user.role,
        jti: expect.stringMatching(/^jwt_/),
      }),
    );
    expect(token).toBe("mocked_access_token");
  });

  it("should generate a refresh token and store session metadata in Redis with 7-day TTL", async () => {
    const userId = "user-uuid-123";
    const deviceInfo = { userAgent: "Expo/Android", ipAddress: "127.0.0.1" };

    const result = await service.generateRefreshToken(userId, deviceInfo);

    expect(result.refreshToken).toBeDefined();
    expect(result.refreshToken).toContain(
      `rf_${result.familyId}_${result.tokenId}`,
    );
    expect(result.familyId).toBeDefined();
    expect(result.tokenId).toBeDefined();

    expect(redisService.set).toHaveBeenCalledWith(
      `auth:refresh:${userId}:${result.familyId}`,
      expect.stringContaining(result.tokenId),
      604800,
    );
  });

  it("should generate token pair successfully", async () => {
    const user = {
      id: "user-uuid-123",
      email: "alex@example.com",
      status: "VERIFIED",
      role: "USER",
    };

    const tokenPair = await service.generateTokenPair(user);

    expect(tokenPair).toEqual({
      accessToken: "mocked_access_token",
      refreshToken: expect.stringMatching(/^rf_/),
      tokenType: "Bearer",
      expiresIn: 900,
    });
  });
});
