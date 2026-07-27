import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class LoginDto {
  @ApiProperty({
    example: "alex@example.com",
    description: "Registered user email address",
  })
  @IsEmail({}, { message: "Must be a valid email address" })
  @IsNotEmpty({ message: "Email is required" })
  @Transform(({ value }: { value: string }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({
    example: "SecurePassword123!",
    description: "User password",
  })
  @IsString()
  @IsNotEmpty({ message: "Password is required" })
  password: string;
}
