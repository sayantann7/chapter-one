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
  const testEmail = `e2e_verify_${Date.now()}@example.com`;
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
        password: "SecurePassword123!",
      })
      .expect(201);

    expect(res.body).toHaveProperty("statusCode", 201);
    expect(res.body.data).toHaveProperty("userId");
    testUserId = res.body.data.userId;

    const storedCode = await redis.get(`auth:code:${testUserId}`);
    expect(storedCode).not.toBeNull();
    verificationCode = storedCode!;
  });

  it("/api/v1/auth/verify-code (POST) - invalid code (400)", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/auth/verify-code")
      .send({
        userId: testUserId,
        code: "000000",
      })
      .expect(400);
  });

  it("/api/v1/auth/verify-code (POST) - non-existent user (404)", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/auth/verify-code")
      .send({
        userId: "a0000000-0000-4000-a000-000000000000",
        code: "123456",
      })
      .expect(404);
  });

  it("/api/v1/auth/verify-code (POST) - success", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/v1/auth/verify-code")
      .send({
        userId: testUserId,
        code: verificationCode,
      })
      .expect(200);

    expect(res.body).toHaveProperty("statusCode", 200);
    expect(res.body.data).toEqual({
      userId: testUserId,
      status: "PENDING_ONBOARDING",
    });

    // Check database state update
    const dbUser = await prisma.user.findUnique({ where: { id: testUserId } });
    expect(dbUser?.status).toBe("PENDING_ONBOARDING");
    expect(dbUser?.isVerified).toBe(true);

    // Check code deleted from Redis
    const redisCode = await redis.get(`auth:code:${testUserId}`);
    expect(redisCode).toBeNull();
  });

  it("/api/v1/auth/verify-code (POST) - code reuse attempt (400)", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/auth/verify-code")
      .send({
        userId: testUserId,
        code: verificationCode,
      })
      .expect(400);
  });
});
