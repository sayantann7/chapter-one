import { BadRequestException, Injectable } from "@nestjs/common";
import { UpdateProfileInterestsDto } from "../dto/update-profile-interests.dto";
import { InterestRepository } from "../repositories/interest.repository";
import { ProfileService } from "./profile.service";

@Injectable()
export class InterestService {
  constructor(
    private readonly interestRepository: InterestRepository,
    private readonly profileService: ProfileService,
  ) {}

  async getInterestsCatalog() {
    const interests = await this.interestRepository.findAll();

    const grouped = interests.reduce(
      (acc, item) => {
        const category = item.category || "General";
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(item);
        return acc;
      },
      {} as Record<string, typeof interests>,
    );

    return grouped;
  }

  async updateUserInterests(userId: string, dto: UpdateProfileInterestsDto) {
    const profile = await this.profileService.getProfileForCurrentUser(userId);

    const uniqueIds = Array.from(new Set(dto.interestIds));
    if (uniqueIds.length !== dto.interestIds.length) {
      throw new BadRequestException("Duplicate interest IDs are not allowed");
    }

    if (dto.interestIds.length < 3 || dto.interestIds.length > 10) {
      throw new BadRequestException(
        "Interests selection must contain between 3 and 10 items",
      );
    }

    const existingInterests = await this.interestRepository.findManyByIds(
      dto.interestIds,
    );

    if (existingInterests.length !== dto.interestIds.length) {
      throw new BadRequestException(
        "One or more interest IDs do not exist in the catalog",
      );
    }

    return this.interestRepository.replaceUserInterests(
      profile.id,
      dto.interestIds,
    );
  }
}
