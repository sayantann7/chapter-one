import { Test, TestingModule } from "@nestjs/testing";
import { VerificationService } from "../services/verification.service";
import { RedisService } from "../../../redis/redis.service";

describe("VerificationService", () => {
  let service: VerificationService;
  let redisService: RedisService;

  const mockRedisService = {
    set: jest.fn().mockResolvedValue("OK"),
    get: jest.fn().mockResolvedValue("123456"),
    del: jest.fn().mockResolvedValue(1),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerificationService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<VerificationService>(VerificationService);
    redisService = module.get<RedisService>(RedisService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should generate a 6-digit numeric verification code", () => {
    const code = service.generateVerificationCode();
    expect(code).toHaveLength(6);
    expect(/^\d{6}$/.test(code)).toBe(true);
  });

  it("should store verification code in Redis with TTL", async () => {
    await service.storeVerificationCode("user-123", "123456", 900);
    expect(redisService.set).toHaveBeenCalledWith(
      "auth:code:user-123",
      "123456",
      900,
    );
  });

  it("should retrieve verification code from Redis", async () => {
    const code = await service.getVerificationCode("user-123");
    expect(redisService.get).toHaveBeenCalledWith("auth:code:user-123");
    expect(code).toBe("123456");
  });

  it("should delete verification code from Redis", async () => {
    await service.deleteVerificationCode("user-123");
    expect(redisService.del).toHaveBeenCalledWith("auth:code:user-123");
  });
});
