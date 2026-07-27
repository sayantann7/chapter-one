import { ApiProperty } from "@nestjs/swagger";
import { ArrayMinSize, IsArray, IsString } from "class-validator";

export class ReorderProfilePhotosDto {
  @ApiProperty({
    description: "Ordered array of photo IDs matching desired display order",
    example: ["photo-uuid-1", "photo-uuid-2", "photo-uuid-3"],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  photoIds: string[];
}
