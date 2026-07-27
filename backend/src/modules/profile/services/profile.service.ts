import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { CreateProfilePhotoDto } from "../dto/create-profile-photo.dto";
import { CreateProfileDto } from "../dto/create-profile.dto";
import { ReorderProfilePhotosDto } from "../dto/reorder-profile-photos.dto";
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

  async addPhoto(userId: string, dto: CreateProfilePhotoDto) {
    const profile = await this.getProfileForCurrentUser(userId);

    const count = await this.prisma.profilePhoto.count({
      where: { profileId: profile.id },
    });

    if (count >= 6) {
      throw new BadRequestException("Maximum 6 photos allowed per profile");
    }

    return this.prisma.profilePhoto.create({
      data: {
        profileId: profile.id,
        url: dto.url,
        thumbnailUrl: dto.thumbnailUrl,
        blurHash: dto.blurHash,
        displayOrder: count,
      },
    });
  }

  async deletePhoto(userId: string, photoId: string) {
    const profile = await this.getProfileForCurrentUser(userId);

    const photo = await this.prisma.profilePhoto.findUnique({
      where: { id: photoId },
    });

    if (!photo || photo.profileId !== profile.id) {
      throw new NotFoundException("Photo not found or owned by another user");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.profilePhoto.delete({
        where: { id: photoId },
      });

      const remaining = await tx.profilePhoto.findMany({
        where: { profileId: profile.id },
        orderBy: { displayOrder: "asc" },
      });

      // Temporary negative displayOrder shift to satisfy @@unique([profileId, displayOrder])
      for (let i = 0; i < remaining.length; i++) {
        await tx.profilePhoto.update({
          where: { id: remaining[i].id },
          data: { displayOrder: -1 - i },
        });
      }

      // Final target displayOrder assignment
      for (let i = 0; i < remaining.length; i++) {
        await tx.profilePhoto.update({
          where: { id: remaining[i].id },
          data: { displayOrder: i },
        });
      }
    });

    return { message: "Photo deleted successfully" };
  }

  async reorderPhotos(userId: string, dto: ReorderProfilePhotosDto) {
    const profile = await this.getProfileForCurrentUser(userId);

    const photos = await this.prisma.profilePhoto.findMany({
      where: { profileId: profile.id },
    });

    if (dto.photoIds.length !== photos.length) {
      throw new BadRequestException("Invalid photo count in reorder request");
    }

    const existingIds = new Set(photos.map((p) => p.id));
    const isValid = dto.photoIds.every((id) => existingIds.has(id));

    if (!isValid) {
      throw new BadRequestException(
        "One or more photo IDs do not belong to user profile",
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // Temporary negative displayOrder shift to satisfy @@unique([profileId, displayOrder])
      for (let i = 0; i < dto.photoIds.length; i++) {
        await tx.profilePhoto.update({
          where: { id: dto.photoIds[i] },
          data: { displayOrder: -1 - i },
        });
      }

      // Final target displayOrder assignment
      for (let i = 0; i < dto.photoIds.length; i++) {
        await tx.profilePhoto.update({
          where: { id: dto.photoIds[i] },
          data: { displayOrder: i },
        });
      }
    });

    return this.prisma.profilePhoto.findMany({
      where: { profileId: profile.id },
      orderBy: { displayOrder: "asc" },
    });
  }
}
