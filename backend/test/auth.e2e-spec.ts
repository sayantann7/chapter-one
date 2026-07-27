import { INestApplication, ValidationPipe } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";
import { RedisService } from "../src/redis/redis.service";

describe("AuthController (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redis: RedisService;
  let jwtService: JwtService;

  const testEmail = `e2e_infra_${Date.now()}@example.com`;
  const testPassword = "SecurePassword123!";
  let testUserId: string;
  let verificationCode: string;
  let validAccessToken: string;
  let refreshToken1: string;

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
    jwtService = app.get<JwtService>(JwtService);
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

    testUserId = res.body.data.userId;
    const storedCode = await redis.get(`auth:code:${testUserId}`);
    verificationCode = storedCode!;
  });

  it("/api/v1/auth/verify-code (POST) - success", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/auth/verify-code")
      .send({
        userId: testUserId,
        code: verificationCode,
      })
      .expect(200);
  });

  it("/api/v1/auth/login (POST) - obtain valid access token & refresh token", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({
        email: testEmail,
        password: testPassword,
      })
      .expect(200);

    validAccessToken = res.body.data.tokens.accessToken;
    refreshToken1 = res.body.data.tokens.refreshToken;

    expect(validAccessToken).toBeDefined();
    expect(refreshToken1).toBeDefined();
  });

  describe("Protected Endpoints (JwtAuthGuard & @CurrentUser)", () => {
    it("/api/v1/auth/protected-test (GET) - access granted with valid Bearer JWT", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/v1/auth/protected-test")
        .set("Authorization", `Bearer ${validAccessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty("statusCode", 200);
      expect(res.body.data.user).toHaveProperty("id", testUserId);
      expect(res.body.data.user).toHaveProperty("email", testEmail);
      expect(res.body.data.user).not.toHaveProperty("passwordHash");
    });

    it("/api/v1/auth/protected-test (GET) - missing Authorization header (401)", async () => {
      await request(app.getHttpServer())
        .get("/api/v1/auth/protected-test")
        .expect(401);
    });

    it("/api/v1/auth/protected-test (GET) - invalid JWT format (401)", async () => {
      await request(app.getHttpServer())
        .get("/api/v1/auth/protected-test")
        .set("Authorization", "Bearer invalid.token.string")
        .expect(401);
    });

    it("/api/v1/auth/protected-test (GET) - expired JWT (401)", async () => {
      const expiredToken = jwtService.sign(
        {
          sub: testUserId,
          email: testEmail,
          status: "PENDING_ONBOARDING",
          role: "USER",
        },
        {
          secret: "chapter-one-super-secret-jwt-key-2026",
          expiresIn: "-10s",
          issuer: "chapter-one-auth",
          audience: "chapter-one-api",
        },
      );

      await request(app.getHttpServer())
        .get("/api/v1/auth/protected-test")
        .set("Authorization", `Bearer ${expiredToken}`)
        .expect(401);
    });

    it("/api/v1/auth/protected-test (GET) - deleted user (401)", async () => {
      // Delete user from DB to simulate deleted user
      await prisma.user.delete({
        where: { id: testUserId },
      });

      await request(app.getHttpServer())
        .get("/api/v1/auth/protected-test")
        .set("Authorization", `Bearer ${validAccessToken}`)
        .expect(401);

      testUserId = ""; // Avoid afterAll error since user was deleted
    });
  });
});
