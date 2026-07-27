import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";
import { RedisService } from "../src/redis/redis.service";

describe("ProfileController (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redis: RedisService;

  const testEmailWithProfile = `e2e_profile_exists_${Date.now()}@example.com`;
  const testEmailNoProfile = `e2e_profile_missing_${Date.now()}@example.com`;
  const testPassword = "SecurePassword123!";

  let userIdWithProfile: string;
  let userIdNoProfile: string;
  let tokenWithProfile: string;
  let tokenNoProfile: string;

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

    // 1. Setup user WITH profile: register -> verify -> create profile -> login
    const regRes1 = await request(app.getHttpServer())
      .post("/api/v1/auth/register")
      .send({ email: testEmailWithProfile, password: testPassword });
    userIdWithProfile = regRes1.body.data.userId;

    const code1 = (await redis.get(`auth:code:${userIdWithProfile}`))!;
    await request(app.getHttpServer())
      .post("/api/v1/auth/verify-code")
      .send({ userId: userIdWithProfile, code: code1 });

    const loginRes1 = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: testEmailWithProfile, password: testPassword });
    tokenWithProfile = loginRes1.body.data.tokens.accessToken;

    // Create a Profile record in DB for userIdWithProfile
    await prisma.profile.create({
      data: {
        userId: userIdWithProfile,
        firstName: "Jordan",
        gender: "NON_BINARY",
        locationName: "New York, NY",
        intent: "LONG_TERM",
      },
    });

    // 2. Setup user WITHOUT profile: register -> verify -> login
    const regRes2 = await request(app.getHttpServer())
      .post("/api/v1/auth/register")
      .send({ email: testEmailNoProfile, password: testPassword });
    userIdNoProfile = regRes2.body.data.userId;

    const code2 = (await redis.get(`auth:code:${userIdNoProfile}`))!;
    await request(app.getHttpServer())
      .post("/api/v1/auth/verify-code")
      .send({ userId: userIdNoProfile, code: code2 });

    const loginRes2 = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: testEmailNoProfile, password: testPassword });
    tokenNoProfile = loginRes2.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    if (userIdWithProfile) {
      await redis.del(`auth:code:${userIdWithProfile}`);
      await prisma.user.deleteMany({ where: { email: testEmailWithProfile } });
    }
    if (userIdNoProfile) {
      await redis.del(`auth:code:${userIdNoProfile}`);
      await prisma.user.deleteMany({ where: { email: testEmailNoProfile } });
    }
    await app.close();
  });

  describe("GET /api/v1/profile/me", () => {
    it("should return 401 Unauthorized for unauthenticated request", async () => {
      await request(app.getHttpServer()).get("/api/v1/profile/me").expect(401);
    });

    it("should return 404 Not Found when profile does not exist", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/v1/profile/me")
        .set("Authorization", `Bearer ${tokenNoProfile}`)
        .expect(404);

      expect(res.body).toHaveProperty("statusCode", 404);
      expect(res.body.message).toContain("Profile not found");
    });

    it("should return 200 OK and profile data when profile exists", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/v1/profile/me")
        .set("Authorization", `Bearer ${tokenWithProfile}`)
        .expect(200);

      expect(res.body).toHaveProperty("statusCode", 200);
      expect(res.body.data).toHaveProperty("userId", userIdWithProfile);
      expect(res.body.data).toHaveProperty("firstName", "Jordan");
      expect(res.body.data).toHaveProperty("gender", "NON_BINARY");
      expect(res.body.data).toHaveProperty("locationName", "New York, NY");
      expect(res.body.data).toHaveProperty("intent", "LONG_TERM");
      expect(res.body.data).toHaveProperty("photos");
      expect(res.body.data).toHaveProperty("userInterests");
      expect(res.body.data).toHaveProperty("prompts");
    });
  });
});
