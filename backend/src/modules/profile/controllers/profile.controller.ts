import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
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
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { CreateProfileDto } from "../dto/create-profile.dto";
import { UpdateProfileDto } from "../dto/update-profile.dto";
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

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create profile for authenticated user" })
  @ApiResponse({
    status: 201,
    description: "Profile created successfully.",
  })
  @ApiConflictResponse({
    description: "Profile already exists for this user",
  })
  @ApiBadRequestResponse({
    description: "Validation failed for payload",
  })
  @ApiUnauthorizedResponse({
    description: "Missing or invalid JWT token",
  })
  async createProfile(
    @CurrentUser("id") userId: string,
    @Body() dto: CreateProfileDto,
  ) {
    const data = await this.profileService.createProfile(userId, dto);
    return {
      statusCode: HttpStatus.CREATED,
      message: "Profile created successfully",
      data,
    };
  }

  @Patch("me")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update profile for current authenticated user" })
  @ApiResponse({
    status: 200,
    description: "Profile updated successfully.",
  })
  @ApiNotFoundResponse({
    description: "Profile not found for authenticated user",
  })
  @ApiBadRequestResponse({
    description: "Validation failed for payload",
  })
  @ApiUnauthorizedResponse({
    description: "Missing or invalid JWT token",
  })
  async updateMyProfile(
    @CurrentUser("id") userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    const data = await this.profileService.updateMyProfile(userId, dto);
    return {
      statusCode: HttpStatus.OK,
      message: "Profile updated successfully",
      data,
    };
  }
}
