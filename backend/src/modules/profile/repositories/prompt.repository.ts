import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class PromptRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    let prompts = await this.prisma.prompt.findMany({
      orderBy: [{ category: "asc" }, { text: "asc" }],
    });

    if (prompts.length === 0) {
      await this.prisma.prompt.createMany({
        data: [
          { text: "A perfect Sunday is...", category: "Lifestyle" },
          { text: "The key to my heart is...", category: "Romance" },
          { text: "Together we could...", category: "Adventure" },
          { text: "My most controversial opinion is...", category: "Fun" },
          { text: "I take pride in...", category: "Personal" },
        ],
        skipDuplicates: true,
      });

      prompts = await this.prisma.prompt.findMany({
        orderBy: [{ category: "asc" }, { text: "asc" }],
      });
    }

    return prompts;
  }

  async findManyByIds(ids: string[]) {
    return this.prisma.prompt.findMany({
      where: { id: { in: ids } },
    });
  }

  async replaceUserPrompts(
    profileId: string,
    prompts: { promptId: string; answer: string }[],
  ) {
    await this.prisma.$transaction(async (tx) => {
      await tx.profilePrompt.deleteMany({
        where: { profileId },
      });

      await tx.profilePrompt.createMany({
        data: prompts.map((p, index) => ({
          profileId,
          promptId: p.promptId,
          answerText: p.answer,
          displayOrder: index,
        })),
      });
    });

    return this.prisma.profilePrompt.findMany({
      where: { profileId },
      include: {
        prompt: true,
      },
      orderBy: { displayOrder: "asc" },
    });
  }
}
