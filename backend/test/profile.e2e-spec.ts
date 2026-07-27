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

  const testEmail1 = `e2e_profile_create_${Date.now()}@example.com`;
  const testEmail2 = `e2e_profile_patch_${Date.now()}@example.com`;
  const testPassword = "SecurePassword123!";

  let userId1: string;
  let userId2: string;
  let token1: string;
  let token2: string;

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

    // Setup user 1: register -> verify -> login
    const regRes1 = await request(app.getHttpServer())
      .post("/api/v1/auth/register")
      .send({ email: testEmail1, password: testPassword });
    userId1 = regRes1.body.data.userId;

    const code1 = (await redis.get(`auth:code:${userId1}`))!;
    await request(app.getHttpServer())
      .post("/api/v1/auth/verify-code")
      .send({ userId: userId1, code: code1 });

    const loginRes1 = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: testEmail1, password: testPassword });
    token1 = loginRes1.body.data.tokens.accessToken;

    // Setup user 2: register -> verify -> login
    const regRes2 = await request(app.getHttpServer())
      .post("/api/v1/auth/register")
      .send({ email: testEmail2, password: testPassword });
    userId2 = regRes2.body.data.userId;

    const code2 = (await redis.get(`auth:code:${userId2}`))!;
    await request(app.getHttpServer())
      .post("/api/v1/auth/verify-code")
      .send({ userId: userId2, code: code2 });

    const loginRes2 = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: testEmail2, password: testPassword });
    token2 = loginRes2.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    if (userId1) {
      await redis.del(`auth:code:${userId1}`);
      await prisma.user.deleteMany({ where: { email: testEmail1 } });
    }
    if (userId2) {
      await redis.del(`auth:code:${userId2}`);
      await prisma.user.deleteMany({ where: { email: testEmail2 } });
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
        .set("Authorization", `Bearer ${token1}`)
        .expect(404);

      expect(res.body).toHaveProperty("statusCode", 404);
      expect(res.body.message).toContain("Profile not found");
    });
  });

  describe("POST /api/v1/profile", () => {
    it("should return 401 Unauthorized for unauthenticated request", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/profile")
        .send({ firstName: "Alex" })
        .expect(401);
    });

    it("should return 400 Bad Request for invalid payload (short firstName)", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/profile")
        .set("Authorization", `Bearer ${token1}`)
        .send({ firstName: "A" })
        .expect(400);
    });

    it("should create profile successfully (201 Created)", async () => {
      const res = await request(app.getHttpServer())
        .post("/api/v1/profile")
        .set("Authorization", `Bearer ${token1}`)
        .send({
          firstName: "Alex",
          gender: "NON_BINARY",
          locationName: "San Francisco, CA",
          bio: "Software developer and outdoor enthusiast.",
          intent: "LONG_TERM",
        })
        .expect(201);

      expect(res.body).toHaveProperty("statusCode", 201);
      expect(res.body.data).toHaveProperty("userId", userId1);
      expect(res.body.data).toHaveProperty("firstName", "Alex");
      expect(res.body.data).toHaveProperty("gender", "NON_BINARY");
    });

    it("should return 409 Conflict when creating duplicate profile", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/profile")
        .set("Authorization", `Bearer ${token1}`)
        .send({ firstName: "Alex" })
        .expect(409);
    });
  });

  describe("PATCH /api/v1/profile/me", () => {
    it("should return 401 Unauthorized for unauthenticated request", async () => {
      await request(app.getHttpServer())
        .patch("/api/v1/profile/me")
        .send({ bio: "New bio" })
        .expect(401);
    });

    it("should return 404 Not Found when updating non-existent profile", async () => {
      await request(app.getHttpServer())
        .patch("/api/v1/profile/me")
        .set("Authorization", `Bearer ${token2}`)
        .send({ bio: "New bio" })
        .expect(404);
    });

    it("should return 400 Bad Request for invalid height payload", async () => {
      await request(app.getHttpServer())
        .patch("/api/v1/profile/me")
        .set("Authorization", `Bearer ${token1}`)
        .send({ heightCm: 500 }) // exceeds max 230
        .expect(400);
    });

    it("should update existing profile successfully (200 OK)", async () => {
      const res = await request(app.getHttpServer())
        .patch("/api/v1/profile/me")
        .set("Authorization", `Bearer ${token1}`)
        .send({
          occupation: "Senior Staff Engineer",
          heightCm: 180,
          drinking: "SOMETIMES",
        })
        .expect(200);

      expect(res.body).toHaveProperty("statusCode", 200);
      expect(res.body.data).toHaveProperty(
        "occupation",
        "Senior Staff Engineer",
      );
      expect(res.body.data).toHaveProperty("heightCm", 180);
      expect(res.body.data).toHaveProperty("drinking", "SOMETIMES");
    });
  });
});
