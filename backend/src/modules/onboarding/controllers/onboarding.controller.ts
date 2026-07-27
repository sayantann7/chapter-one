import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { OnboardingService } from "../services/onboarding.service";

@ApiTags("Onboarding")
@Controller("onboarding")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth("Bearer")
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get("status")
  @ApiOperation({ summary: "Get onboarding status for authenticated user" })
  @ApiResponse({
    status: 200,
    description: "Returns current onboarding status and completion state.",
    schema: {
      example: {
        statusCode: 200,
        message: "Onboarding status retrieved",
        data: {
          userId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
          status: "PENDING_ONBOARDING",
          isCompleted: false,
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: "Missing or invalid JWT token",
  })
  @ApiNotFoundResponse({
    description: "User account not found",
  })
  async getStatus(@CurrentUser("id") userId: string) {
    const data = await this.onboardingService.getOnboardingStatus(userId);
    return {
      statusCode: HttpStatus.OK,
      message: "Onboarding status retrieved",
      data,
    };
  }

  @Post("complete")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Complete onboarding and transition user status to ACTIVE",
  })
  @ApiResponse({
    status: 200,
    description:
      "Onboarding completed successfully. User status updated to ACTIVE.",
    schema: {
      example: {
        statusCode: 200,
        message: "Onboarding completed successfully",
        data: {
          userId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
          status: "ACTIVE",
          isCompleted: true,
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: "User status is unverified, suspended, or deactivated",
  })
  @ApiUnauthorizedResponse({
    description: "Missing or invalid JWT token",
  })
  async complete(@CurrentUser("id") userId: string) {
    const data = await this.onboardingService.completeOnboarding(userId);
    return {
      statusCode: HttpStatus.OK,
      message: "Onboarding completed successfully",
      data,
    };
  }
}
