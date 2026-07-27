import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { ProfileController } from "./controllers/profile.controller";
import { InterestRepository } from "./repositories/interest.repository";
import { PhotoRepository } from "./repositories/photo.repository";
import { ProfileRepository } from "./repositories/profile.repository";
import { InterestService } from "./services/interest.service";
import { PhotoService } from "./services/photo.service";
import { ProfileService } from "./services/profile.service";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ProfileController],
  providers: [
    ProfileRepository,
    PhotoRepository,
    InterestRepository,
    ProfileService,
    PhotoService,
    InterestService,
  ],
  exports: [
    ProfileRepository,
    PhotoRepository,
    InterestRepository,
    ProfileService,
    PhotoService,
    InterestService,
  ],
})
export class ProfileModule {}
