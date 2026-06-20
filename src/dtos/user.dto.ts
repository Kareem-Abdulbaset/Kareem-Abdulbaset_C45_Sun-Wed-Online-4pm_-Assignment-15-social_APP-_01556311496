import { Transform } from "class-transformer";
import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { IsNotBlank } from "../common/decorators/validation.decorators";
import { toBoolean, toLowerTrimmedString, toTrimmedString } from "../common/transforms";
import { UserRole } from "../models/user.model";

export class CreateUserDto {
  @Transform(toTrimmedString)
  @IsString()
  @IsNotBlank()
  @MinLength(2)
  name!: string;

  @Transform(toLowerTrimmedString)
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsIn(["user", "admin"])
  role?: UserRole;
}

export class UpdateMeDto {
  @IsOptional()
  @Transform(toTrimmedString)
  @IsString()
  @IsNotBlank()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @Transform(toTrimmedString)
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @Transform(toTrimmedString)
  @IsString()
  avatar?: string;

  @IsOptional()
  @Transform(toTrimmedString)
  @IsString()
  coverImage?: string;
}

export class UpdateUserDto extends UpdateMeDto {
  @IsOptional()
  @IsIn(["user", "admin"])
  role?: UserRole;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isConfirmed?: boolean;
}
