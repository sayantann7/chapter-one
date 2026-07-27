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
  const testEmail = `e2e_register_${Date.now()}@example.com`;

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
    // Cleanup created test user
    const createdUser = await prisma.user.findUnique({
      where: { email: testEmail },
    });
    if (createdUser) {
      await redis.del(`auth:code:${createdUser.id}`);
      await prisma.user.delete({ where: { id: createdUser.id } });
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
    expect(res.body).toHaveProperty(
      "message",
      "Registration successful. Verification code sent.",
    );
    expect(res.body.data).toHaveProperty("userId");
    expect(res.body.data).toHaveProperty("status", "UNVERIFIED");
    expect(res.body.data).toHaveProperty("verificationExpiresInSeconds", 900);

    // Verify user in PostgreSQL database
    const dbUser = await prisma.user.findUnique({
      where: { email: testEmail },
    });
    expect(dbUser).not.toBeNull();
    expect(dbUser?.status).toBe("UNVERIFIED");
    expect(dbUser?.passwordHash).toContain("$argon2id$");

    // Verify code stored in Redis
    const redisCode = await redis.get(`auth:code:${dbUser!.id}`);
    expect(redisCode).not.toBeNull();
    expect(redisCode).toHaveLength(6);
  });

  it("/api/v1/auth/register (POST) - duplicate email conflict (409)", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/auth/register")
      .send({
        email: testEmail,
        password: "SecurePassword123!",
      })
      .expect(409);
  });

  it("/api/v1/auth/register (POST) - validation failure (400)", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/auth/register")
      .send({
        email: "invalid-email-format",
        password: "123",
      })
      .expect(400);
  });
});
