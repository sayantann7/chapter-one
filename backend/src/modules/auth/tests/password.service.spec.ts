import { Test, TestingModule } from "@nestjs/testing";
import { PasswordService } from "../services/password.service";

describe("PasswordService", () => {
  let service: PasswordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordService],
    }).compile();

    service = module.get<PasswordService>(PasswordService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should hash a password using Argon2id", async () => {
    const plain = "SecurePassword123!";
    const hash = await service.hashPassword(plain);

    expect(hash).toBeDefined();
    expect(hash).toContain("$argon2id$");
  });

  it("should verify correct password", async () => {
    const plain = "SecurePassword123!";
    const hash = await service.hashPassword(plain);

    const isValid = await service.verifyPassword(hash, plain);
    expect(isValid).toBe(true);
  });

  it("should reject incorrect password", async () => {
    const plain = "SecurePassword123!";
    const hash = await service.hashPassword(plain);

    const isValid = await service.verifyPassword(hash, "WrongPassword123!");
    expect(isValid).toBe(false);
  });
});
