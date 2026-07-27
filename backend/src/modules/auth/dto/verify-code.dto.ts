import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsUUID, Length, Matches } from "class-validator";

export class VerifyCodeDto {
  @ApiProperty({
    example: "usr_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    description: "ID of the user to verify",
  })
  @IsUUID("4", { message: "userId must be a valid UUID" })
  @IsNotEmpty({ message: "userId is required" })
  userId: string;

  @ApiProperty({
    example: "123456",
    description: "6-digit numeric verification code sent to email/SMS",
  })
  @IsString()
  @IsNotEmpty({ message: "code is required" })
  @Length(6, 6, { message: "Verification code must be exactly 6 digits" })
  @Matches(/^[0-9]+$/, {
    message: "Verification code must contain only numbers",
  })
  code: string;
}
