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

  const testEmail1 = `e2e_photo_test1_${Date.now()}@example.com`;
  const testEmail2 = `e2e_photo_test2_${Date.now()}@example.com`;
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

    // Setup user 1: register -> verify -> login -> create profile
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

    await request(app.getHttpServer())
      .post("/api/v1/profile")
      .set("Authorization", `Bearer ${token1}`)
      .send({ firstName: "Alex" });

    // Setup user 2: register -> verify -> login -> create profile
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

    await request(app.getHttpServer())
      .post("/api/v1/profile")
      .set("Authorization", `Bearer ${token2}`)
      .send({ firstName: "Sam" });
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

    it("should return 200 OK and profile data", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/v1/profile/me")
        .set("Authorization", `Bearer ${token1}`)
        .expect(200);

      expect(res.body).toHaveProperty("statusCode", 200);
      expect(res.body.data).toHaveProperty("userId", userId1);
      expect(res.body.data).toHaveProperty("firstName", "Alex");
    });
  });

  describe("POST /api/v1/profile/photos", () => {
    it("should return 401 Unauthorized for unauthenticated request", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/profile/photos")
        .send({ url: "https://images.com/p1.jpg" })
        .expect(401);
    });

    it("should return 400 Bad Request for invalid photo URL", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/profile/photos")
        .set("Authorization", `Bearer ${token1}`)
        .send({ url: "not-a-valid-url" })
        .expect(400);
    });

    it("should add photos and auto-assign displayOrder (0..5)", async () => {
      for (let i = 0; i < 6; i++) {
        const res = await request(app.getHttpServer())
          .post("/api/v1/profile/photos")
          .set("Authorization", `Bearer ${token1}`)
          .send({ url: `https://images.com/photo-${i + 1}.jpg` })
          .expect(201);

        expect(res.body.data).toHaveProperty("displayOrder", i);
      }
    });

    it("should return 400 Bad Request when adding 7th photo (max 6 limit)", async () => {
      const res = await request(app.getHttpServer())
        .post("/api/v1/profile/photos")
        .set("Authorization", `Bearer ${token1}`)
        .send({ url: "https://images.com/photo-7.jpg" })
        .expect(400);

      expect(res.body.message).toContain("Maximum 6 photos allowed");
    });
  });

  describe("PUT /api/v1/profile/photos/reorder", () => {
    it("should return 401 Unauthorized for unauthenticated request", async () => {
      await request(app.getHttpServer())
        .put("/api/v1/profile/photos/reorder")
        .send({ photoIds: ["some-id"] })
        .expect(401);
    });

    it("should reorder photos successfully (200 OK)", async () => {
      const profileRes = await request(app.getHttpServer())
        .get("/api/v1/profile/me")
        .set("Authorization", `Bearer ${token1}`)
        .expect(200);

      const photos = profileRes.body.data.photos;
      const reversedIds = photos.map((p: any) => p.id).reverse();

      const res = await request(app.getHttpServer())
        .put("/api/v1/profile/photos/reorder")
        .set("Authorization", `Bearer ${token1}`)
        .send({ photoIds: reversedIds })
        .expect(200);

      expect(res.body.data[0]).toHaveProperty("id", reversedIds[0]);
      expect(res.body.data[0]).toHaveProperty("displayOrder", 0);
    });
  });

  describe("DELETE /api/v1/profile/photos/:photoId", () => {
    let photoToDeleteId: string;

    it("should return 401 Unauthorized for unauthenticated request", async () => {
      await request(app.getHttpServer())
        .delete("/api/v1/profile/photos/fake-id")
        .expect(401);
    });

    it("should return 404 Not Found when trying to delete user 1 photo with user 2 token", async () => {
      const profileRes = await request(app.getHttpServer())
        .get("/api/v1/profile/me")
        .set("Authorization", `Bearer ${token1}`)
        .expect(200);

      photoToDeleteId = profileRes.body.data.photos[0].id;

      await request(app.getHttpServer())
        .delete(`/api/v1/profile/photos/${photoToDeleteId}`)
        .set("Authorization", `Bearer ${token2}`)
        .expect(404);
    });

    it("should delete photo successfully and reorder remaining photos (0..4)", async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/profile/photos/${photoToDeleteId}`)
        .set("Authorization", `Bearer ${token1}`)
        .expect(200);

      const profileRes = await request(app.getHttpServer())
        .get("/api/v1/profile/me")
        .set("Authorization", `Bearer ${token1}`)
        .expect(200);

      const remainingPhotos = profileRes.body.data.photos;
      expect(remainingPhotos).toHaveLength(5);
      remainingPhotos.forEach((p: any, idx: number) => {
        expect(p.displayOrder).toBe(idx);
      });
    });
  });
});
