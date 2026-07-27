import { ApiPropertyOptional } from "@nestjs/swagger";
import { Gender, RelationshipIntent } from "@prisma/client";
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from "class-validator";

export class UpdatePreferencesDto {
  @ApiPropertyOptional({
    description: "Minimum preferred age (18-100)",
    example: 21,
  })
  @IsOptional()
  @IsInt()
  @Min(18)
  @Max(100)
  minAge?: number;

  @ApiPropertyOptional({
    description: "Maximum preferred age (18-100)",
    example: 35,
  })
  @IsOptional()
  @IsInt()
  @Min(18)
  @Max(100)
  maxAge?: number;

  @ApiPropertyOptional({
    description: "Maximum search distance in kilometers (1-500)",
    example: 50,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  maxDistanceKm?: number;

  @ApiPropertyOptional({
    description: "Preferred gender choices for discovery matching",
    enum: Gender,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(Gender, { each: true })
  @ArrayUnique()
  preferredGenders?: Gender[];

  @ApiPropertyOptional({
    description: "Preferred relationship intent choices",
    enum: RelationshipIntent,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(RelationshipIntent, { each: true })
  @ArrayUnique()
  preferredIntents?: RelationshipIntent[];
}
