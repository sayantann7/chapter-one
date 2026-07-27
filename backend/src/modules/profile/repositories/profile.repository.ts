import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class ProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string) {
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

  async create(userId: string, data: any) {
    return this.prisma.profile.create({
      data: {
        userId,
        ...data,
      },
      include: {
        photos: true,
        voiceIntro: true,
        userInterests: true,
        prompts: true,
      },
    });
  }

  async update(userId: string, data: any) {
    return this.prisma.profile.update({
      where: { userId },
      data,
      include: {
        photos: true,
        voiceIntro: true,
        userInterests: true,
        prompts: true,
      },
    });
  }
}
