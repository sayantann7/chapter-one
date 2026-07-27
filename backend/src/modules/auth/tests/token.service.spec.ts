import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import { TokenService } from "../services/token.service";

describe("TokenService", () => {
  let service: TokenService;
  let jwtService: JwtService;

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue("mocked_access_token"),
    verifyAsync: jest.fn().mockResolvedValue({
      sub: "user-uuid-123",
      email: "alex@example.com",
      status: "VERIFIED",
      role: "USER",
    }),
    decode: jest.fn().mockReturnValue({
      sub: "user-uuid-123",
      email: "alex@example.com",
      status: "VERIFIED",
      role: "USER",
    }),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      if (key === "JWT_ISSUER") return "chapter-one-auth";
      if (key === "JWT_AUDIENCE") return "chapter-one-api";
      return defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should generate an access token with issuer and audience options", async () => {
    const user = {
      id: "user-uuid-123",
      email: "alex@example.com",
      status: "VERIFIED",
      role: "USER",
    };

    const token = await service.generateAccessToken(user);

    expect(jwtService.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: user.id,
        email: user.email,
        status: user.status,
        role: user.role,
        jti: expect.stringMatching(/^jwt_/),
      }),
      {
        issuer: "chapter-one-auth",
        audience: "chapter-one-api",
      },
    );
    expect(token).toBe("mocked_access_token");
  });

  it("should generate a refresh token string matching rf_<userId>_<familyId>_<tokenId>", () => {
    const tokenString = service.generateRefreshTokenString(
      "user-1",
      "family-1",
      "token-1",
    );
    expect(tokenString).toBe("rf_user-1_family-1_token-1");
  });

  it("should parse a valid refresh token string", () => {
    const parsed = service.parseRefreshTokenString(
      "rf_user-1_family-1_token-1",
    );
    expect(parsed).toEqual({
      userId: "user-1",
      familyId: "family-1",
      tokenId: "token-1",
    });
  });

  it("should throw UnauthorizedException for malformed refresh token string", () => {
    expect(() => service.parseRefreshTokenString("invalid-string")).toThrow(
      UnauthorizedException,
    );
  });

  it("should verify JWT correctly", async () => {
    const verified = await service.verifyJwt("mocked_access_token");
    expect(jwtService.verifyAsync).toHaveBeenCalledWith("mocked_access_token", {
      issuer: "chapter-one-auth",
      audience: "chapter-one-api",
    });
    expect(verified.sub).toBe("user-uuid-123");
  });

  it("should decode JWT correctly", () => {
    const decoded = service.decodeJwt("mocked_access_token");
    expect(jwtService.decode).toHaveBeenCalledWith("mocked_access_token");
    expect(decoded?.sub).toBe("user-uuid-123");
  });
});
