import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class RefreshTokenDto {
  @ApiProperty({
    example:
      "rf_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d_a1b2c3d4-e5f6-7890-abcd-ef1234567890_12345678-1234-1234-1234-1234567890ab",
    description: "Active refresh token string",
  })
  @IsString()
  @IsNotEmpty({ message: "refreshToken is required" })
  refreshToken: string;
}
