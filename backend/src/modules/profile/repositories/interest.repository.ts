import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class InterestRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    let interests = await this.prisma.interest.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    if (interests.length === 0) {
      await this.prisma.interest.createMany({
        data: [
          { name: "Hiking", category: "Outdoors" },
          { name: "Camping", category: "Outdoors" },
          { name: "Coding", category: "Tech" },
          { name: "Photography", category: "Arts" },
          { name: "Cooking", category: "Culinary" },
          { name: "Yoga", category: "Fitness" },
        ],
        skipDuplicates: true,
      });

      interests = await this.prisma.interest.findMany({
        orderBy: [{ category: "asc" }, { name: "asc" }],
      });
    }

    return interests;
  }

  async findManyByIds(ids: string[]) {
    return this.prisma.interest.findMany({
      where: { id: { in: ids } },
    });
  }

  async replaceUserInterests(profileId: string, interestIds: string[]) {
    await this.prisma.$transaction(async (tx) => {
      await tx.profileInterest.deleteMany({
        where: { profileId },
      });

      await tx.profileInterest.createMany({
        data: interestIds.map((interestId) => ({
          profileId,
          interestId,
        })),
      });
    });

    return this.prisma.profileInterest.findMany({
      where: { profileId },
      include: {
        interest: true,
      },
    });
  }
}
