import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";
import { RedisService } from "../src/redis/redis.service";
import { TokenService } from "../src/modules/auth/services/token.service";

describe("OnboardingController (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redis: RedisService;
  let tokenService: TokenService;

  const testEmailPending = `e2e_onboarding_pending_${Date.now()}@example.com`;
  const testEmailUnverified = `e2e_onboarding_unverified_${Date.now()}@example.com`;
  const testPassword = "SecurePassword123!";

  let pendingUserId: string;
  let unverifiedUserId: string;
  let pendingUserToken: string;
  let unverifiedUserToken: string;
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
    tokenService = app.get<TokenService>(TokenService);

    // 1. Setup pending user: register -> verify -> login
    const regRes = await request(app.getHttpServer())
      .post("/api/v1/auth/register")
      .send({ email: testEmailPending, password: testPassword });
    pendingUserId = regRes.body.data.userId;

    verificationCode = (await redis.get(`auth:code:${pendingUserId}`))!;

    await request(app.getHttpServer())
      .post("/api/v1/auth/verify-code")
      .send({ userId: pendingUserId, code: verificationCode });

    const loginRes = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: testEmailPending, password: testPassword });
    pendingUserToken = loginRes.body.data.tokens.accessToken;

    // 2. Setup unverified user: register only
    const regUnverifiedRes = await request(app.getHttpServer())
      .post("/api/v1/auth/register")
      .send({ email: testEmailUnverified, password: testPassword });
    unverifiedUserId = regUnverifiedRes.body.data.userId;

    // Generate JWT access token directly for unverified user testing
    unverifiedUserToken = await tokenService.generateAccessToken({
      id: unverifiedUserId,
      email: testEmailUnverified,
      status: "UNVERIFIED",
      role: "USER",
    });
  });

  afterAll(async () => {
    if (pendingUserId) {
      await redis.del(`auth:code:${pendingUserId}`);
      await prisma.user.deleteMany({ where: { email: testEmailPending } });
    }
    if (unverifiedUserId) {
      await redis.del(`auth:code:${unverifiedUserId}`);
      await prisma.user.deleteMany({ where: { email: testEmailUnverified } });
    }
    await app.close();
  });

  describe("GET /api/v1/onboarding/status", () => {
    it("should return 401 Unauthorized for unauthenticated access", async () => {
      await request(app.getHttpServer())
        .get("/api/v1/onboarding/status")
        .expect(401);
    });

    it("should return onboarding status for authenticated user in PENDING_ONBOARDING state", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/v1/onboarding/status")
        .set("Authorization", `Bearer ${pendingUserToken}`)
        .expect(200);

      expect(res.body).toHaveProperty("statusCode", 200);
      expect(res.body.data).toEqual({
        userId: pendingUserId,
        status: "PENDING_ONBOARDING",
        isCompleted: false,
      });
    });
  });

  describe("POST /api/v1/onboarding/complete", () => {
    it("should return 401 Unauthorized for unauthenticated access", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/onboarding/complete")
        .expect(401);
    });

    it("should return 400 BadRequest when completing onboarding for an UNVERIFIED user", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/onboarding/complete")
        .set("Authorization", `Bearer ${unverifiedUserToken}`)
        .expect(400);
    });

    it("should transition status from PENDING_ONBOARDING to ACTIVE successfully", async () => {
      const res = await request(app.getHttpServer())
        .post("/api/v1/onboarding/complete")
        .set("Authorization", `Bearer ${pendingUserToken}`)
        .expect(200);

      expect(res.body).toHaveProperty("statusCode", 200);
      expect(res.body.data).toEqual({
        userId: pendingUserId,
        status: "ACTIVE",
        isCompleted: true,
      });

      // Verify status in PostgreSQL database
      const dbUser = await prisma.user.findUnique({
        where: { id: pendingUserId },
      });
      expect(dbUser?.status).toBe("ACTIVE");
    });

    it("should return isCompleted: true when called again on an already ACTIVE user", async () => {
      const res = await request(app.getHttpServer())
        .post("/api/v1/onboarding/complete")
        .set("Authorization", `Bearer ${pendingUserToken}`)
        .expect(200);

      expect(res.body.data).toEqual({
        userId: pendingUserId,
        status: "ACTIVE",
        isCompleted: true,
      });
    });
  });
});
