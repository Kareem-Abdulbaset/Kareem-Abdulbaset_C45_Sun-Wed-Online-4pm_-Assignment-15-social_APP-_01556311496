import { Transform } from "class-transformer";
import { IsBoolean, IsIn, IsObject, IsOptional, IsString, MaxLength } from "class-validator";
import { IsNotBlank, IsObjectId } from "../common/decorators/validation.decorators";
import { toBoolean, toOptionalTrimmedString, toTrimmedString } from "../common/transforms";
import { NotificationType } from "../models/notification.model";

export class FcmTokenDto {
  @Transform(toTrimmedString)
  @IsString()
  @IsNotBlank({ message: "Token is required" })
  token!: string;
}

export class CreateNotificationDto {
  @Transform(toTrimmedString)
  @IsString()
  @IsNotBlank({ message: "Title is required" })
  @MaxLength(200)
  title!: string;

  @Transform(toTrimmedString)
  @IsString()
  @IsNotBlank({ message: "Body is required" })
  @MaxLength(1000)
  body!: string;

  @IsOptional()
  @IsIn(["system", "post", "comment", "story", "custom"])
  type?: NotificationType;

  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;

  @IsOptional()
  @Transform(toOptionalTrimmedString)
  @IsObjectId({ message: "Valid userId is required" })
  userId?: string;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  sendNow?: boolean;
}

export class UpdateNotificationDto {
  @IsOptional()
  @Transform(toTrimmedString)
  @IsString()
  @IsNotBlank({ message: "Title is required" })
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @Transform(toTrimmedString)
  @IsString()
  @IsNotBlank({ message: "Body is required" })
  @MaxLength(1000)
  body?: string;

  @IsOptional()
  @IsIn(["system", "post", "comment", "story", "custom"])
  type?: NotificationType;

  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;

  @IsOptional()
  @Transform(toOptionalTrimmedString)
  @IsObjectId({ message: "Valid userId is required" })
  userId?: string;
}
