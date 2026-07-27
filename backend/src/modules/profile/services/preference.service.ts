import { BadRequestException, Injectable } from "@nestjs/common";
import { UpdatePreferencesDto } from "../dto/update-preferences.dto";
import { PreferenceRepository } from "../repositories/preference.repository";
import { ProfileService } from "./profile.service";

const DEFAULT_PREFERENCES = {
  minAge: 18,
  maxAge: 99,
  maxDistanceKm: 50,
  preferredGenders: [],
  preferredIntents: [],
};

@Injectable()
export class PreferenceService {
  constructor(
    private readonly preferenceRepository: PreferenceRepository,
    private readonly profileService: ProfileService,
  ) {}

  async getPreferences(userId: string) {
    // Ensure profile exists for current user (throws NotFoundException if missing)
    await this.profileService.getProfileForCurrentUser(userId);

    const existing = await this.preferenceRepository.findByUserId(userId);

    if (!existing) {
      return {
        userId,
        ...DEFAULT_PREFERENCES,
      };
    }

    return existing;
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    // Ensure profile exists for current user (throws NotFoundException if missing)
    await this.profileService.getProfileForCurrentUser(userId);

    const existing = await this.preferenceRepository.findByUserId(userId);

    const effectiveMinAge =
      dto.minAge ?? existing?.minAge ?? DEFAULT_PREFERENCES.minAge;
    const effectiveMaxAge =
      dto.maxAge ?? existing?.maxAge ?? DEFAULT_PREFERENCES.maxAge;

    if (effectiveMinAge > effectiveMaxAge) {
      throw new BadRequestException("minAge cannot be greater than maxAge");
    }

    return this.preferenceRepository.upsert(userId, dto);
  }
}
