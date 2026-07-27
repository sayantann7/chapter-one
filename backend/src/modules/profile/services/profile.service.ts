import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateProfileDto } from "../dto/create-profile.dto";
import { UpdateProfileDto } from "../dto/update-profile.dto";
import { ProfileRepository } from "../repositories/profile.repository";

@Injectable()
export class ProfileService {
  constructor(private readonly profileRepository: ProfileRepository) {}

  async getProfileByUserId(userId: string) {
    return this.profileRepository.findByUserId(userId);
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

    return this.profileRepository.create(userId, {
      ...rest,
      birthdate: birthdate ? new Date(birthdate) : undefined,
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

    return this.profileRepository.update(userId, {
      ...rest,
      birthdate: birthdate ? new Date(birthdate) : undefined,
    });
  }
}
