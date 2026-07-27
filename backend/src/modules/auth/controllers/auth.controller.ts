import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Ip,
  Headers,
  Post,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { LoginDto } from "../dto/login.dto";
import { RegisterDto } from "../dto/register.dto";
import { VerifyCodeDto } from "../dto/verify-code.dto";
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
            refreshToken: "rf_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d_a1b2c3d4",
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
}
