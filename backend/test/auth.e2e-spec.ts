import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";
import { RedisService } from "../src/redis/redis.service";

describe("AuthController (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redis: RedisService;
  const testEmail = `e2e_refresh_${Date.now()}@example.com`;
  const testPassword = "SecurePassword123!";
  let testUserId: string;
  let verificationCode: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api/v1");
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    redis = app.get<RedisService>(RedisService);
  });

  afterAll(async () => {
    if (testUserId) {
      await redis.del(`auth:code:${testUserId}`);
      await prisma.user.deleteMany({ where: { email: testEmail } });
    }
    await app.close();
  });

  it("/api/v1/auth/register (POST) - success", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/v1/auth/register")
      .send({
        email: testEmail,
        password: testPassword,
      })
      .expect(201);

    expect(res.body).toHaveProperty("statusCode", 201);
    expect(res.body.data).toHaveProperty("userId");
    testUserId = res.body.data.userId;

    const storedCode = await redis.get(`auth:code:${testUserId}`);
    expect(storedCode).not.toBeNull();
    verificationCode = storedCode!;
  });

  it("/api/v1/auth/verify-code (POST) - success", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/v1/auth/verify-code")
      .send({
        userId: testUserId,
        code: verificationCode,
      })
      .expect(200);

    expect(res.body.data.status).toBe("PENDING_ONBOARDING");
  });

  it("/api/v1/auth/login (POST) - success with access token & refresh token stored in Redis", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .set("User-Agent", "E2ETestClient/1.0")
      .send({
        email: testEmail,
        password: testPassword,
      })
      .expect(200);

    expect(res.body).toHaveProperty("statusCode", 200);
    expect(res.body.data).toHaveProperty("tokens");
    expect(res.body.data.tokens).toHaveProperty("accessToken");
    expect(res.body.data.tokens).toHaveProperty("refreshToken");
    expect(res.body.data.tokens.tokenType).toBe("Bearer");
    expect(res.body.data.tokens.expiresIn).toBe(900);

    const refreshTokenString: string = res.body.data.tokens.refreshToken;
    expect(refreshTokenString).toMatch(/^rf_/);

    const parts = refreshTokenString.split("_");
    expect(parts.length).toBe(3);
    const familyId = parts[1];
    const tokenId = parts[2];

    // Verify session metadata is persisted in Redis
    const sessionJson = await redis.get(
      `auth:refresh:${testUserId}:${familyId}`,
    );
    expect(sessionJson).not.toBeNull();
    const sessionData = JSON.parse(sessionJson!);
    expect(sessionData.tokenId).toBe(tokenId);
    expect(sessionData.userAgent).toBe("E2ETestClient/1.0");
  });
});
