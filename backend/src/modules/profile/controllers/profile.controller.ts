import { Controller, Get, HttpStatus, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { ProfileService } from "../services/profile.service";

@ApiTags("Profile")
@Controller("profile")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth("Bearer")
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get("me")
  @ApiOperation({ summary: "Get current authenticated user profile" })
  @ApiResponse({
    status: 200,
    description: "Returns profile of current authenticated user.",
    schema: {
      example: {
        statusCode: 200,
        message: "Profile retrieved successfully",
        data: {
          id: "b1d034a2-7b89-4e12-8921-9876543210ab",
          userId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
          firstName: "Alex",
          gender: "NON_BINARY",
          locationName: "San Francisco, CA",
          intent: "LONG_TERM",
          completionScore: 85,
          isComplete: true,
          photos: [],
          voiceIntro: null,
          userInterests: [],
          prompts: [],
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: "Missing or invalid JWT token",
  })
  @ApiNotFoundResponse({
    description: "Profile not found for authenticated user",
  })
  async getMyProfile(@CurrentUser("id") userId: string) {
    const data = await this.profileService.getProfileForCurrentUser(userId);
    return {
      statusCode: HttpStatus.OK,
      message: "Profile retrieved successfully",
      data,
    };
  }
}
