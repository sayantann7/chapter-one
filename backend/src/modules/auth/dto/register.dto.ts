import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class RegisterDto {
  @ApiProperty({
    example: "alex@example.com",
    description: "User email address",
  })
  @IsEmail({}, { message: "Must be a valid email address" })
  @IsNotEmpty({ message: "Email is required" })
  @Transform(({ value }: { value: string }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({
    example: "SecurePassword123!",
    description:
      "User password (min 8 chars, 1 uppercase, 1 lowercase, 1 number/special char)",
  })
  @IsString()
  @IsNotEmpty({ message: "Password is required" })
  @MinLength(8, { message: "Password must be at least 8 characters long" })
  @MaxLength(64, { message: "Password cannot exceed 64 characters" })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      "Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number or special character",
  })
  password: string;

  @ApiPropertyOptional({
    example: "+12025550143",
    description: "User phone number in E.164 format",
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}
