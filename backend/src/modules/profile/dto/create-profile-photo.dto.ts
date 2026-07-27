import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUrl } from "class-validator";

export class CreateProfilePhotoDto {
  @ApiProperty({
    description: "Photo CDN URL",
    example: "https://images.chapterone.com/photos/photo-123.jpg",
  })
  @IsString()
  @IsUrl()
  url: string;

  @ApiPropertyOptional({
    description: "Thumbnail CDN URL",
    example: "https://images.chapterone.com/photos/thumb-123.jpg",
  })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional({
    description: "BlurHash placeholder for fast UI loading",
    example: "L6PZf_jE00ay~qj[00ayFTj[4nWB",
  })
  @IsOptional()
  @IsString()
  blurHash?: string;
}
