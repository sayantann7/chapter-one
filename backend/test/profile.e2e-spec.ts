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

  const testEmail1 = `e2e_interest_test1_${Date.now()}@example.com`;
  const testEmail2 = `e2e_interest_test2_${Date.now()}@example.com`;
  const testPassword = "SecurePassword123!";

  let userId1: string;
  let userId2: string;
  let token1: string;
  let token2: string;

  let catalogInterestIds: string[] = [];

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

    // Seed Interests catalog if empty
    let dbInterests = await prisma.interest.findMany();
    if (dbInterests.length < 5) {
      await prisma.interest.createMany({
        data: [
          { name: "Hiking", category: "Outdoors" },
          { name: "Camping", category: "Outdoors" },
          { name: "Coding", category: "Tech" },
          { name: "Photography", category: "Arts" },
          { name: "Cooking", category: "Culinary" },
        ],
        skipDuplicates: true,
      });
      dbInterests = await prisma.interest.findMany();
    }
    catalogInterestIds = dbInterests.map((i) => i.id);

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

  describe("GET /api/v1/profile/interests", () => {
    it("should return 401 Unauthorized for unauthenticated request", async () => {
      await request(app.getHttpServer())
        .get("/api/v1/profile/interests")
        .expect(401);
    });

    it("should return interest catalog grouped by category (200 OK)", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/v1/profile/interests")
        .set("Authorization", `Bearer ${token1}`)
        .expect(200);

      expect(res.body).toHaveProperty("statusCode", 200);
      expect(typeof res.body.data).toBe("object");
    });
  });

  describe("PUT /api/v1/profile/interests", () => {
    it("should return 401 Unauthorized for unauthenticated request", async () => {
      await request(app.getHttpServer())
        .put("/api/v1/profile/interests")
        .send({ interestIds: catalogInterestIds.slice(0, 3) })
        .expect(401);
    });

    it("should return 400 Bad Request for too few selections (< 3)", async () => {
      await request(app.getHttpServer())
        .put("/api/v1/profile/interests")
        .set("Authorization", `Bearer ${token1}`)
        .send({ interestIds: catalogInterestIds.slice(0, 2) })
        .expect(400);
    });

    it("should return 400 Bad Request for duplicate interest IDs", async () => {
      await request(app.getHttpServer())
        .put("/api/v1/profile/interests")
        .set("Authorization", `Bearer ${token1}`)
        .send({
          interestIds: [
            catalogInterestIds[0],
            catalogInterestIds[0],
            catalogInterestIds[1],
          ],
        })
        .expect(400);
    });

    it("should return 400 Bad Request for invalid non-existent interest ID", async () => {
      await request(app.getHttpServer())
        .put("/api/v1/profile/interests")
        .set("Authorization", `Bearer ${token1}`)
        .send({
          interestIds: [
            catalogInterestIds[0],
            catalogInterestIds[1],
            "non-existent-interest-uuid",
          ],
        })
        .expect(400);
    });

    it("should update user interests atomically (200 OK)", async () => {
      const selectedIds = catalogInterestIds.slice(0, 3);

      const res = await request(app.getHttpServer())
        .put("/api/v1/profile/interests")
        .set("Authorization", `Bearer ${token1}`)
        .send({ interestIds: selectedIds })
        .expect(200);

      expect(res.body).toHaveProperty("statusCode", 200);
      expect(res.body.data).toHaveLength(3);
    });
  });
});
