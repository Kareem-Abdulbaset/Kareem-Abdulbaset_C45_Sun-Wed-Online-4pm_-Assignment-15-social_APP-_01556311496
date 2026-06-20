import { Transform } from "class-transformer";
import { IsEmail, IsString, MinLength, ValidateIf } from "class-validator";
import { IsNotBlank } from "../common/decorators/validation.decorators";
import { toLowerTrimmedString, toTrimmedString } from "../common/transforms";

export class SignupDto {
  @Transform(toTrimmedString)
  @IsString()
  @IsNotBlank()
  name!: string;

  @Transform(toLowerTrimmedString)
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

export class ConfirmEmailDto {
  @Transform(toLowerTrimmedString)
  @IsEmail()
  email!: string;

  @Transform(toTrimmedString)
  @IsString()
  @IsNotBlank()
  code!: string;
}

export class LoginDto {
  @Transform(toLowerTrimmedString)
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotBlank()
  password!: string;
}

export class GoogleLoginDto {
  @ValidateIf((dto: GoogleLoginDto) => !dto.credential)
  @Transform(toTrimmedString)
  @IsString()
  @IsNotBlank({ message: "Google token is required" })
  idToken?: string;

  @ValidateIf((dto: GoogleLoginDto) => !dto.idToken)
  @Transform(toTrimmedString)
  @IsString()
  @IsNotBlank({ message: "Google token is required" })
  credential?: string;
}

export class ForgotPasswordDto {
  @Transform(toLowerTrimmedString)
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @Transform(toLowerTrimmedString)
  @IsEmail()
  email!: string;

  @ValidateIf((dto: ResetPasswordDto) => !dto.code)
  @Transform(toTrimmedString)
  @IsString()
  @IsNotBlank({ message: "Otp is required" })
  otp?: string;

  @ValidateIf((dto: ResetPasswordDto) => !dto.otp)
  @Transform(toTrimmedString)
  @IsString()
  @IsNotBlank({ message: "Otp is required" })
  code?: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

export class UpdatePasswordDto {
  @IsString()
  @IsNotBlank()
  oldPassword!: string;

  @IsString()
  @MinLength(6)
  newPassword!: string;
}
