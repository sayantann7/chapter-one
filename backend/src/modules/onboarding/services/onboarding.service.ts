import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

export interface OnboardingStatusResult {
  userId: string;
  status: string;
  isCompleted: boolean;
}

export interface OnboardingCompleteResult {
  userId: string;
  status: string;
  isCompleted: boolean;
}

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  async getOnboardingStatus(userId: string): Promise<OnboardingStatusResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("User account not found");
    }

    const isCompleted = user.status === "ACTIVE" || user.status === "VERIFIED";

    return {
      userId: user.id,
      status: user.status,
      isCompleted,
    };
  }

  async completeOnboarding(userId: string): Promise<OnboardingCompleteResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("User account not found");
    }

    if (
      user.status === "UNVERIFIED" ||
      user.status === "SUSPENDED" ||
      user.status === "DEACTIVATED"
    ) {
      throw new BadRequestException(
        `Cannot complete onboarding for account with status: ${user.status}`,
      );
    }

    if (user.status === "ACTIVE" || user.status === "VERIFIED") {
      return {
        userId: user.id,
        status: user.status,
        isCompleted: true,
      };
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { status: "ACTIVE" },
    });

    return {
      userId: updatedUser.id,
      status: updatedUser.status,
      isCompleted: true,
    };
  }
}
