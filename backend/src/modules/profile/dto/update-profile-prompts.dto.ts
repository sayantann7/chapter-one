import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";

export class PromptResponseDto {
  @ApiProperty({
    description: "System prompt UUID",
    example: "prompt-uuid-1",
  })
  @IsString()
  @IsNotEmpty()
  promptId: string;

  @ApiProperty({
    description: "User response answer to the prompt (5-300 characters)",
    example:
      "A perfect Sunday is brewing fresh coffee and going for a long walk.",
  })
  @IsString()
  @MinLength(5)
  @MaxLength(300)
  answer: string;
}

export class UpdateProfilePromptsDto {
  @ApiProperty({
    description: "Array of prompt responses (min 1, max 3)",
    type: [PromptResponseDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => PromptResponseDto)
  prompts: PromptResponseDto[];
}
