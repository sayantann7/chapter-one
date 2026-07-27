import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateProfilePhotoDto } from "../dto/create-profile-photo.dto";
import { ReorderProfilePhotosDto } from "../dto/reorder-profile-photos.dto";
import { PhotoRepository } from "../repositories/photo.repository";
import { ProfileService } from "./profile.service";

@Injectable()
export class PhotoService {
  constructor(
    private readonly photoRepository: PhotoRepository,
    private readonly profileService: ProfileService,
  ) {}

  async addPhoto(userId: string, dto: CreateProfilePhotoDto) {
    const profile = await this.profileService.getProfileForCurrentUser(userId);

    const count = await this.photoRepository.countByProfileId(profile.id);

    if (count >= 6) {
      throw new BadRequestException("Maximum 6 photos allowed per profile");
    }

    return this.photoRepository.create(profile.id, dto, count);
  }

  async deletePhoto(userId: string, photoId: string) {
    const profile = await this.profileService.getProfileForCurrentUser(userId);

    const photo = await this.photoRepository.findById(photoId);

    if (!photo || photo.profileId !== profile.id) {
      throw new NotFoundException("Photo not found or owned by another user");
    }

    await this.photoRepository.deleteAndReorder(profile.id, photoId);

    return { message: "Photo deleted successfully" };
  }

  async reorderPhotos(userId: string, dto: ReorderProfilePhotosDto) {
    const profile = await this.profileService.getProfileForCurrentUser(userId);

    const photos = await this.photoRepository.findManyByProfileId(profile.id);

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

    return this.photoRepository.reorderPhotos(profile.id, dto.photoIds);
  }
}
