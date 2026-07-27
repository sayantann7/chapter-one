import { BadRequestException, Injectable } from "@nestjs/common";
import { UpdateProfilePromptsDto } from "../dto/update-profile-prompts.dto";
import { PromptRepository } from "../repositories/prompt.repository";
import { ProfileService } from "./profile.service";

@Injectable()
export class PromptService {
  constructor(
    private readonly promptRepository: PromptRepository,
    private readonly profileService: ProfileService,
  ) {}

  async getPromptsCatalog() {
    const prompts = await this.promptRepository.findAll();

    const grouped = prompts.reduce(
      (acc, item) => {
        const category = item.category || "General";
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(item);
        return acc;
      },
      {} as Record<string, typeof prompts>,
    );

    return grouped;
  }

  async updateUserPrompts(userId: string, dto: UpdateProfilePromptsDto) {
    const profile = await this.profileService.getProfileForCurrentUser(userId);

    if (!dto.prompts || dto.prompts.length < 1 || dto.prompts.length > 3) {
      throw new BadRequestException(
        "Prompts selection must contain between 1 and 3 items",
      );
    }

    const promptIds = dto.prompts.map((p) => p.promptId);
    const uniqueIds = Array.from(new Set(promptIds));

    if (uniqueIds.length !== promptIds.length) {
      throw new BadRequestException("Duplicate prompt IDs are not allowed");
    }

    const existingPrompts =
      await this.promptRepository.findManyByIds(promptIds);

    if (existingPrompts.length !== promptIds.length) {
      throw new BadRequestException(
        "One or more prompt IDs do not exist in the catalog",
      );
    }

    return this.promptRepository.replaceUserPrompts(profile.id, dto.prompts);
  }
}
