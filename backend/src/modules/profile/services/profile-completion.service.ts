import { Injectable } from "@nestjs/common";
import { PhotoRepository } from "../repositories/photo.repository";
import { PreferenceService } from "./preference.service";
import { ProfileService } from "./profile.service";

export interface ProfileCompletionResult {
  percentage: number;
  isComplete: boolean;
  completedSections: string[];
  missingSections: string[];
}

@Injectable()
export class ProfileCompletionService {
  constructor(
    private readonly profileService: ProfileService,
    private readonly photoRepository: PhotoRepository,
    private readonly preferenceService: PreferenceService,
  ) {}

  async getProfileCompletion(userId: string): Promise<ProfileCompletionResult> {
    const profile = await this.profileService.getProfileForCurrentUser(userId);

    const completedSections: string[] = [];
    const missingSections: string[] = [];

    // 1. Basic Profile (firstName, birthdate, gender, bio non-empty)
    const isBasicComplete =
      Boolean(profile.firstName) &&
      Boolean(profile.birthdate) &&
      Boolean(profile.gender) &&
      Boolean(profile.bio && profile.bio.trim().length > 0);

    if (isBasicComplete) {
      completedSections.push("basic_profile");
    } else {
      missingSections.push("basic_profile");
    }

    // 2. Photos (at least 2 photos exist)
    const photoCount = profile.photos
      ? profile.photos.length
      : await this.photoRepository.countByProfileId(profile.id);
    if (photoCount >= 2) {
      completedSections.push("photos");
    } else {
      missingSections.push("photos");
    }

    // 3. Interests (at least 3 interests selected)
    const interestCount = profile.userInterests
      ? profile.userInterests.length
      : 0;
    if (interestCount >= 3) {
      completedSections.push("interests");
    } else {
      missingSections.push("interests");
    }

    // 4. Prompts (at least 1 prompt answered)
    const promptCount = profile.prompts ? profile.prompts.length : 0;
    if (promptCount >= 1) {
      completedSections.push("prompts");
    } else {
      missingSections.push("prompts");
    }

    // 5. Preferences (PreferenceService returns successfully, defaults count as complete)
    try {
      await this.preferenceService.getPreferences(userId);
      completedSections.push("preferences");
    } catch {
      missingSections.push("preferences");
    }

    const totalSections = 5;
    const percentage = Math.round(
      (completedSections.length / totalSections) * 100,
    );
    const isComplete = completedSections.length === totalSections;

    return {
      percentage,
      isComplete,
      completedSections,
      missingSections,
    };
  }
}
