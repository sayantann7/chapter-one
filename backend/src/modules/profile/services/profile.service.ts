import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfileByUserId(userId: string) {
    return this.prisma.profile.findUnique({
      where: { userId },
      include: {
        photos: {
          orderBy: { displayOrder: "asc" },
        },
        voiceIntro: true,
        userInterests: {
          include: {
            interest: true,
          },
        },
        prompts: {
          include: {
            prompt: true,
          },
          orderBy: { displayOrder: "asc" },
        },
      },
    });
  }

  async getProfileForCurrentUser(userId: string) {
    const profile = await this.getProfileByUserId(userId);

    if (!profile) {
      throw new NotFoundException("Profile not found");
    }

    return profile;
  }
}
