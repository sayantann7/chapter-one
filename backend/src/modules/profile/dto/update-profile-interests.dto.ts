import { ApiProperty } from "@nestjs/swagger";
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsString,
} from "class-validator";

export class UpdateProfileInterestsDto {
  @ApiProperty({
    description:
      "Array of selected system interest UUIDs (min 3, max 10, unique)",
    example: ["interest-uuid-1", "interest-uuid-2", "interest-uuid-3"],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(3)
  @ArrayMaxSize(10)
  @ArrayUnique()
  interestIds: string[];
}
