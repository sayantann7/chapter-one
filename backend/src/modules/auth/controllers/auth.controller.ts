import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import {
  ApiConflictResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { RegisterDto } from "../dto/register.dto";
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
}
