import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { RedisService } from "../../../redis/redis.service";
import { SessionService } from "../services/session.service";

describe("SessionService", () => {
  let service: SessionService;
  let redisService: RedisService;

  const mockRedisService = {
    set: jest.fn().mockResolvedValue("OK"),
    get: jest.fn(),
    del: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue([]),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue("604800s"),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        { provide: RedisService, useValue: mockRedisService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
    redisService = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should create a session in Redis with 7-day TTL", async () => {
    await service.createSession("user-1", "family-1", "token-1", {
      userAgent: "Expo",
      ipAddress: "127.0.0.1",
    });

    expect(redisService.set).toHaveBeenCalledWith(
      "auth:refresh:user-1:family-1",
      expect.stringContaining("token-1"),
      604800,
    );
  });

  it("should retrieve a session from Redis", async () => {
    const mockSession = {
      tokenId: "token-1",
      createdAt: 1774630000,
      userAgent: "Expo",
      ipAddress: "127.0.0.1",
    };
    mockRedisService.get.mockResolvedValue(JSON.stringify(mockSession));

    const result = await service.getSession("user-1", "family-1");

    expect(redisService.get).toHaveBeenCalledWith(
      "auth:refresh:user-1:family-1",
    );
    expect(result).toEqual(mockSession);
  });

  it("should return null if session is not found in Redis", async () => {
    mockRedisService.get.mockResolvedValue(null);

    const result = await service.getSession("user-1", "family-1");

    expect(result).toBeNull();
  });

  it("should update a session in Redis with new tokenId", async () => {
    const mockSession = {
      tokenId: "token-1",
      createdAt: 1774630000,
      userAgent: "Expo",
      ipAddress: "127.0.0.1",
    };
    mockRedisService.get.mockResolvedValue(JSON.stringify(mockSession));

    await service.updateSession("user-1", "family-1", "new-token-2");

    expect(redisService.set).toHaveBeenCalledWith(
      "auth:refresh:user-1:family-1",
      expect.stringContaining("new-token-2"),
      604800,
    );
  });

  it("should delete a session from Redis", async () => {
    await service.deleteSession("user-1", "family-1");

    expect(redisService.del).toHaveBeenCalledWith(
      "auth:refresh:user-1:family-1",
    );
  });

  it("should delete all sessions for a user", async () => {
    mockRedisService.keys.mockResolvedValue([
      "auth:refresh:user-1:family-1",
      "auth:refresh:user-1:family-2",
    ]);

    await service.deleteAllSessionsForUser("user-1");

    expect(redisService.keys).toHaveBeenCalledWith("auth:refresh:user-1:*");
    expect(redisService.del).toHaveBeenCalledWith(
      "auth:refresh:user-1:family-1",
    );
    expect(redisService.del).toHaveBeenCalledWith(
      "auth:refresh:user-1:family-2",
    );
  });
});
