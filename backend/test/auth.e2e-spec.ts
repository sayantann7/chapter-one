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
  const testEmail = `e2e_rtr_${Date.now()}@example.com`;
  const testPassword = "SecurePassword123!";
  let testUserId: string;
  let verificationCode: string;
  let refreshToken1: string;
  let refreshToken2: string;

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

  it("/api/v1/auth/login (POST) - obtain initial refresh token", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({
        email: testEmail,
        password: testPassword,
      })
      .expect(200);

    refreshToken1 = res.body.data.tokens.refreshToken;
    expect(refreshToken1).toBeDefined();
    expect(refreshToken1).toMatch(/^rf_/);
  });

  it("/api/v1/auth/refresh (POST) - rotate token 1 successfully", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/v1/auth/refresh")
      .send({
        refreshToken: refreshToken1,
      })
      .expect(200);

    expect(res.body).toHaveProperty("statusCode", 200);
    expect(res.body.data).toHaveProperty("accessToken");
    expect(res.body.data).toHaveProperty("refreshToken");

    refreshToken2 = res.body.data.refreshToken;
    expect(refreshToken2).not.toBe(refreshToken1);
    expect(refreshToken2).toMatch(/^rf_/);
  });

  it("/api/v1/auth/refresh (POST) - single-use rotation enforcement (re-using token 1 fails with 401)", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/auth/refresh")
      .send({
        refreshToken: refreshToken1,
      })
      .expect(401);
  });

  it("/api/v1/auth/refresh (POST) - rotate token 2 successfully", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/v1/auth/refresh")
      .send({
        refreshToken: refreshToken2,
      })
      .expect(200);

    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.refreshToken).not.toBe(refreshToken2);
  });

  it("/api/v1/auth/refresh (POST) - invalid token format (401)", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/auth/refresh")
      .send({
        refreshToken: "invalid_token_format",
      })
      .expect(401);
  });
});
