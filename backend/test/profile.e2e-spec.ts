import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { Gender, RelationshipIntent } from "@prisma/client";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";
import { RedisService } from "../src/redis/redis.service";

describe("ProfileController (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redis: RedisService;

  const testEmail1 = `e2e_pref_test1_${Date.now()}@example.com`;
  const testEmail2 = `e2e_pref_test2_${Date.now()}@example.com`;
  const testPassword = "SecurePassword123!";

  let userId1: string;
  let userId2: string;
  let token1: string;
  let token2: string;

  let catalogInterestIds: string[] = [];
  let catalogPromptIds: string[] = [];

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

    // Seed Prompts catalog if empty
    let dbPrompts = await prisma.prompt.findMany();
    if (dbPrompts.length < 3) {
      await prisma.prompt.createMany({
        data: [
          { text: "A perfect Sunday is...", category: "Lifestyle" },
          { text: "The key to my heart is...", category: "Romance" },
          { text: "Together we could...", category: "Adventure" },
        ],
        skipDuplicates: true,
      });
      dbPrompts = await prisma.prompt.findMany();
    }
    catalogPromptIds = dbPrompts.map((p) => p.id);

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

  describe("GET /api/v1/profile/prompts", () => {
    it("should return 401 Unauthorized for unauthenticated request", async () => {
      await request(app.getHttpServer())
        .get("/api/v1/profile/prompts")
        .expect(401);
    });

    it("should return prompt catalog grouped by category (200 OK)", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/v1/profile/prompts")
        .set("Authorization", `Bearer ${token1}`)
        .expect(200);

      expect(res.body).toHaveProperty("statusCode", 200);
      expect(typeof res.body.data).toBe("object");
    });
  });

  describe("PUT /api/v1/profile/prompts", () => {
    it("should return 401 Unauthorized for unauthenticated request", async () => {
      await request(app.getHttpServer())
        .put("/api/v1/profile/prompts")
        .send({
          prompts: [
            { promptId: catalogPromptIds[0], answer: "Valid long answer text" },
          ],
        })
        .expect(401);
    });

    it("should return 400 Bad Request for answer shorter than 5 chars", async () => {
      await request(app.getHttpServer())
        .put("/api/v1/profile/prompts")
        .set("Authorization", `Bearer ${token1}`)
        .send({ prompts: [{ promptId: catalogPromptIds[0], answer: "Hey" }] })
        .expect(400);
    });

    it("should return 400 Bad Request for duplicate prompt IDs", async () => {
      await request(app.getHttpServer())
        .put("/api/v1/profile/prompts")
        .set("Authorization", `Bearer ${token1}`)
        .send({
          prompts: [
            { promptId: catalogPromptIds[0], answer: "Answer number one text" },
            { promptId: catalogPromptIds[0], answer: "Answer number two text" },
          ],
        })
        .expect(400);
    });

    it("should return 400 Bad Request for non-existent prompt ID", async () => {
      await request(app.getHttpServer())
        .put("/api/v1/profile/prompts")
        .set("Authorization", `Bearer ${token1}`)
        .send({
          prompts: [
            {
              promptId: "non-existent-prompt-uuid",
              answer: "Valid answer text sample",
            },
          ],
        })
        .expect(400);
    });

    it("should replace user prompt responses atomically (200 OK)", async () => {
      const payload = {
        prompts: [
          {
            promptId: catalogPromptIds[0],
            answer: "A cup of fresh coffee and a morning walk in the park.",
          },
          {
            promptId: catalogPromptIds[1],
            answer: "Honesty, empathy, and a shared sense of humor.",
          },
        ],
      };

      const res = await request(app.getHttpServer())
        .put("/api/v1/profile/prompts")
        .set("Authorization", `Bearer ${token1}`)
        .send(payload)
        .expect(200);

      expect(res.body).toHaveProperty("statusCode", 200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0]).toHaveProperty("promptId", catalogPromptIds[0]);
    });
  });

  describe("GET /api/v1/profile/preferences", () => {
    it("should return 401 Unauthorized for unauthenticated request", async () => {
      await request(app.getHttpServer())
        .get("/api/v1/profile/preferences")
        .expect(401);
    });

    it("should return default preferences when none exist yet (200 OK)", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/v1/profile/preferences")
        .set("Authorization", `Bearer ${token1}`)
        .expect(200);

      expect(res.body).toHaveProperty("statusCode", 200);
      expect(res.body.data).toHaveProperty("minAge", 18);
      expect(res.body.data).toHaveProperty("maxAge", 99);
      expect(res.body.data).toHaveProperty("maxDistanceKm", 50);
    });
  });

  describe("PATCH /api/v1/profile/preferences", () => {
    it("should return 401 Unauthorized for unauthenticated request", async () => {
      await request(app.getHttpServer())
        .patch("/api/v1/profile/preferences")
        .send({ minAge: 21, maxAge: 35 })
        .expect(401);
    });

    it("should return 400 Bad Request when minAge > maxAge", async () => {
      await request(app.getHttpServer())
        .patch("/api/v1/profile/preferences")
        .set("Authorization", `Bearer ${token1}`)
        .send({ minAge: 40, maxAge: 25 })
        .expect(400);
    });

    it("should return 400 Bad Request for duplicate preferredGenders enum entries", async () => {
      await request(app.getHttpServer())
        .patch("/api/v1/profile/preferences")
        .set("Authorization", `Bearer ${token1}`)
        .send({ preferredGenders: [Gender.FEMALE, Gender.FEMALE] })
        .expect(400);
    });

    it("should update preferences successfully (200 OK)", async () => {
      const payload = {
        minAge: 22,
        maxAge: 32,
        maxDistanceKm: 40,
        preferredGenders: [Gender.FEMALE, Gender.NON_BINARY],
        preferredIntents: [RelationshipIntent.LONG_TERM],
      };

      const res = await request(app.getHttpServer())
        .patch("/api/v1/profile/preferences")
        .set("Authorization", `Bearer ${token1}`)
        .send(payload)
        .expect(200);

      expect(res.body).toHaveProperty("statusCode", 200);
      expect(res.body.data).toHaveProperty("minAge", 22);
      expect(res.body.data).toHaveProperty("maxAge", 32);
      expect(res.body.data).toHaveProperty("maxDistanceKm", 40);
      expect(res.body.data.preferredGenders).toContain(Gender.FEMALE);
      expect(res.body.data.preferredIntents).toContain(
        RelationshipIntent.LONG_TERM,
      );
    });
  });
});
