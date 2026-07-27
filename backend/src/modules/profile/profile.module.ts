import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { ProfileController } from "./controllers/profile.controller";
import { InterestRepository } from "./repositories/interest.repository";
import { PhotoRepository } from "./repositories/photo.repository";
import { PreferenceRepository } from "./repositories/preference.repository";
import { ProfileRepository } from "./repositories/profile.repository";
import { PromptRepository } from "./repositories/prompt.repository";
import { InterestService } from "./services/interest.service";
import { PhotoService } from "./services/photo.service";
import { PreferenceService } from "./services/preference.service";
import { ProfileCompletionService } from "./services/profile-completion.service";
import { ProfileService } from "./services/profile.service";
import { PromptService } from "./services/prompt.service";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ProfileController],
  providers: [
    ProfileRepository,
    PhotoRepository,
    InterestRepository,
    PromptRepository,
    PreferenceRepository,
    ProfileService,
    PhotoService,
    InterestService,
    PromptService,
    PreferenceService,
    ProfileCompletionService,
  ],
  exports: [
    ProfileRepository,
    PhotoRepository,
    InterestRepository,
    PromptRepository,
    PreferenceRepository,
    ProfileService,
    PhotoService,
    InterestService,
    PromptService,
    PreferenceService,
    ProfileCompletionService,
  ],
})
export class ProfileModule {}
