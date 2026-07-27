import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { ProfileController } from "./controllers/profile.controller";
import { InterestRepository } from "./repositories/interest.repository";
import { PhotoRepository } from "./repositories/photo.repository";
import { ProfileRepository } from "./repositories/profile.repository";
import { PromptRepository } from "./repositories/prompt.repository";
import { InterestService } from "./services/interest.service";
import { PhotoService } from "./services/photo.service";
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
    ProfileService,
    PhotoService,
    InterestService,
    PromptService,
  ],
  exports: [
    ProfileRepository,
    PhotoRepository,
    InterestRepository,
    PromptRepository,
    ProfileService,
    PhotoService,
    InterestService,
    PromptService,
  ],
})
export class ProfileModule {}
