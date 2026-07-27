import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Gender, LifestyleChoice, RelationshipIntent } from "@prisma/client";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class CreateProfileDto {
  @ApiProperty({ description: "User first name", example: "Alex" })
  @IsString()
  @Length(2, 30)
  firstName: string;

  @ApiPropertyOptional({
    description: "Birthdate in ISO 8601 format",
    example: "1998-05-15",
  })
  @IsOptional()
  @IsDateString()
  birthdate?: string;

  @ApiPropertyOptional({
    enum: Gender,
    description: "User gender identity",
    example: Gender.NON_BINARY,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({
    description: "Preferred pronouns",
    example: "they/them",
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  pronouns?: string;

  @ApiPropertyOptional({ description: "Height in centimeters", example: 175 })
  @IsOptional()
  @IsInt()
  @Min(90)
  @Max(230)
  heightCm?: number;

  @ApiPropertyOptional({
    description: "City/Location name",
    example: "San Francisco, CA",
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  locationName?: string;

  @ApiPropertyOptional({
    description: "Location latitude coordinate",
    example: 37.7749,
  })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({
    description: "Location longitude coordinate",
    example: -122.4194,
  })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({
    description: "Occupation / Title",
    example: "Software Engineer",
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  occupation?: string;

  @ApiPropertyOptional({ description: "Company name", example: "Tech Corp" })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  company?: string;

  @ApiPropertyOptional({
    description: "Education background",
    example: "Stanford University",
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  education?: string;

  @ApiPropertyOptional({
    description: "Short bio summary",
    example: "Passionate about coffee, books, and hiking.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({
    enum: RelationshipIntent,
    description: "Relationship intent filter",
    example: RelationshipIntent.LONG_TERM,
  })
  @IsOptional()
  @IsEnum(RelationshipIntent)
  intent?: RelationshipIntent;

  @ApiPropertyOptional({
    enum: LifestyleChoice,
    description: "Drinking habit",
    example: LifestyleChoice.SOMETIMES,
  })
  @IsOptional()
  @IsEnum(LifestyleChoice)
  drinking?: LifestyleChoice;

  @ApiPropertyOptional({
    enum: LifestyleChoice,
    description: "Smoking habit",
    example: LifestyleChoice.NEVER,
  })
  @IsOptional()
  @IsEnum(LifestyleChoice)
  smoking?: LifestyleChoice;

  @ApiPropertyOptional({
    enum: LifestyleChoice,
    description: "Workout habit",
    example: LifestyleChoice.FREQUENTLY,
  })
  @IsOptional()
  @IsEnum(LifestyleChoice)
  workout?: LifestyleChoice;

  @ApiPropertyOptional({ description: "Has children", example: false })
  @IsOptional()
  @IsBoolean()
  hasChildren?: boolean;

  @ApiPropertyOptional({ description: "Wants children", example: true })
  @IsOptional()
  @IsBoolean()
  wantsChildren?: boolean;

  @ApiPropertyOptional({
    description: "Religious beliefs / background",
    example: "Spiritual",
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  religion?: string;
}
