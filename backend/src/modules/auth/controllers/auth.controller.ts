import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Headers,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { CurrentUser } from "../decorators/current-user.decorator";
import { LoginDto } from "../dto/login.dto";
import { RefreshTokenDto } from "../dto/refresh-token.dto";
import { RegisterDto } from "../dto/register.dto";
import { VerifyCodeDto } from "../dto/verify-code.dto";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { AuthService } from "../services/auth.service";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Register a new user account" })
  @ApiResponse({
    status: 201,
    description: "Registration successful. Verification code generated.",
    schema: {
      example: {
        statusCode: 201,
        message: "Registration successful. Verification code sent.",
        data: {
          userId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
          status: "UNVERIFIED",
          verificationExpiresInSeconds: 900,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Validation failed for request DTO",
  })
  @ApiConflictResponse({
    description: "Account with this email already exists",
  })
  async register(@Body() dto: RegisterDto) {
    const data = await this.authService.register(dto);
    return {
      statusCode: HttpStatus.CREATED,
      message: "Registration successful. Verification code sent.",
      data,
    };
  }

  @Post("verify-code")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify account using 6-digit code" })
  @ApiResponse({
    status: 200,
    description:
      "Account verified successfully. Status updated to PENDING_ONBOARDING.",
    schema: {
      example: {
        statusCode: 200,
        message: "Account verified successfully",
        data: {
          userId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
          status: "PENDING_ONBOARDING",
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description:
      "Verification code is invalid, expired, or user is already verified",
  })
  @ApiNotFoundResponse({
    description: "User account not found",
  })
  async verifyCode(@Body() dto: VerifyCodeDto) {
    const data = await this.authService.verifyCode(dto);
    return {
      statusCode: HttpStatus.OK,
      message: "Account verified successfully",
      data,
    };
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Authenticate user with email and password" })
  @ApiResponse({
    status: 200,
    description:
      "Login successful. Returns user details, access token, and refresh token.",
    schema: {
      example: {
        statusCode: 200,
        message: "Login successful",
        data: {
          user: {
            id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
            email: "alex@example.com",
            status: "PENDING_ONBOARDING",
            role: "USER",
          },
          tokens: {
            accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            refreshToken:
              "rf_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d_a1b2c3d4-e5f6-7890-abcd-ef1234567890_12345678-1234-1234-1234-1234567890ab",
            tokenType: "Bearer",
            expiresIn: 900,
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: "Validation failed for request DTO",
  })
  @ApiUnauthorizedResponse({
    description:
      "Invalid credentials or account is unverified/suspended/deactivated",
  })
  async login(
    @Body() dto: LoginDto,
    @Headers("user-agent") userAgent?: string,
    @Ip() ipAddress?: string,
  ) {
    const data = await this.authService.login(dto, { userAgent, ipAddress });
    return {
      statusCode: HttpStatus.OK,
      message: "Login successful",
      data,
    };
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Rotate tokens using an active refresh token" })
  @ApiResponse({
    status: 200,
    description:
      "Tokens rotated successfully. Returns new access token and new single-use refresh token.",
    schema: {
      example: {
        statusCode: 200,
        message: "Tokens refreshed successfully",
        data: {
          accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          refreshToken:
            "rf_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d_a1b2c3d4-e5f6-7890-abcd-ef1234567890_87654321-4321-4321-4321-0987654321ba",
          tokenType: "Bearer",
          expiresIn: 900,
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: "Validation failed for request DTO",
  })
  @ApiUnauthorizedResponse({
    description: "Invalid, expired, or previously rotated refresh token",
  })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Headers("user-agent") userAgent?: string,
    @Ip() ipAddress?: string,
  ) {
    const data = await this.authService.refreshToken(dto, {
      userAgent,
      ipAddress,
    });
    return {
      statusCode: HttpStatus.OK,
      message: "Tokens refreshed successfully",
      data,
    };
  }

  @Get("protected-test")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("Bearer")
  @ApiOperation({
    summary: "Test protected endpoint requiring valid JWT bearer token",
  })
  @ApiResponse({
    status: 200,
    description: "Access granted. Returns authenticated user payload.",
  })
  @ApiUnauthorizedResponse({
    description: "Missing, invalid, expired JWT, or deleted user",
  })
  async protectedTest(@CurrentUser() user: any) {
    return {
      statusCode: HttpStatus.OK,
      message: "Access granted to protected route",
      data: { user },
    };
  }
}
