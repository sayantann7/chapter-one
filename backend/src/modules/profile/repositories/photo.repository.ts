import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class PhotoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async countByProfileId(profileId: string): Promise<number> {
    return this.prisma.profilePhoto.count({
      where: { profileId },
    });
  }

  async findById(photoId: string) {
    return this.prisma.profilePhoto.findUnique({
      where: { id: photoId },
    });
  }

  async findManyByProfileId(profileId: string) {
    return this.prisma.profilePhoto.findMany({
      where: { profileId },
      orderBy: { displayOrder: "asc" },
    });
  }

  async create(profileId: string, data: any, displayOrder: number) {
    return this.prisma.profilePhoto.create({
      data: {
        profileId,
        url: data.url,
        thumbnailUrl: data.thumbnailUrl,
        blurHash: data.blurHash,
        displayOrder,
      },
    });
  }

  async deleteAndReorder(profileId: string, photoId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.profilePhoto.delete({
        where: { id: photoId },
      });

      const remaining = await tx.profilePhoto.findMany({
        where: { profileId },
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
  }

  async reorderPhotos(profileId: string, photoIds: string[]) {
    await this.prisma.$transaction(async (tx) => {
      // Temporary negative displayOrder shift to satisfy @@unique([profileId, displayOrder])
      for (let i = 0; i < photoIds.length; i++) {
        await tx.profilePhoto.update({
          where: { id: photoIds[i] },
          data: { displayOrder: -1 - i },
        });
      }

      // Final target displayOrder assignment
      for (let i = 0; i < photoIds.length; i++) {
        await tx.profilePhoto.update({
          where: { id: photoIds[i] },
          data: { displayOrder: i },
        });
      }
    });

    return this.findManyByProfileId(profileId);
  }
}
