import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { CreateProfileDto } from "../dto/create-profile.dto";
import { UpdateProfileDto } from "../dto/update-profile.dto";

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

  async createProfile(userId: string, dto: CreateProfileDto) {
    const existing = await this.getProfileByUserId(userId);
    if (existing) {
      throw new ConflictException("Profile already exists for this user");
    }

    const { birthdate, ...rest } = dto;

    return this.prisma.profile.create({
      data: {
        userId,
        ...rest,
        birthdate: birthdate ? new Date(birthdate) : undefined,
      },
      include: {
        photos: true,
        voiceIntro: true,
        userInterests: true,
        prompts: true,
      },
    });
  }

  async updateMyProfile(userId: string, dto: UpdateProfileDto) {
    const existing = await this.getProfileByUserId(userId);
    if (!existing) {
      throw new NotFoundException("Profile not found");
    }

    // Strip out system fields if passed dynamically
    const { birthdate, ...rest } = dto;
    delete (rest as any).userId;
    delete (rest as any).completionScore;
    delete (rest as any).isComplete;

    return this.prisma.profile.update({
      where: { userId },
      data: {
        ...rest,
        birthdate: birthdate ? new Date(birthdate) : undefined,
      },
      include: {
        photos: true,
        voiceIntro: true,
        userInterests: true,
        prompts: true,
      },
    });
  }
}
