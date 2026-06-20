import { Transform } from "class-transformer";
import { IsArray, IsOptional, IsString, MaxLength, ValidateIf } from "class-validator";
import {
  IsNonEmptyStringArray,
  IsNotBlank,
  IsObjectIdArray
} from "../common/decorators/validation.decorators";
import { toTrimmedString, toTrimmedStringArray } from "../common/transforms";

const hasAttachments = (dto: { attachments?: unknown[] }) => {
  return Array.isArray(dto.attachments) && dto.attachments.length > 0;
};

export class CreateCommentDto {
  @ValidateIf((dto: CreateCommentDto) => !hasAttachments(dto))
  @Transform(toTrimmedString)
  @IsString()
  @IsNotBlank({ message: "Content or attachments are required" })
  @MaxLength(1000)
  content?: string;

  @IsOptional()
  @Transform(toTrimmedStringArray)
  @IsArray()
  @IsNonEmptyStringArray()
  attachments?: string[];

  @IsOptional()
  @Transform(toTrimmedString)
  @IsString()
  folderId?: string;

  @IsOptional()
  @IsArray()
  @IsObjectIdArray()
  tags?: string[];
}

export class UpdateCommentDto {
  @ValidateIf((dto: UpdateCommentDto) => dto.content !== undefined && !hasAttachments(dto))
  @Transform(toTrimmedString)
  @IsString()
  @IsNotBlank({ message: "Content or attachments are required" })
  @MaxLength(1000)
  content?: string;

  @IsOptional()
  @Transform(toTrimmedStringArray)
  @IsArray()
  @IsNonEmptyStringArray()
  attachments?: string[];

  @IsOptional()
  @Transform(toTrimmedString)
  @IsString()
  folderId?: string;

  @IsOptional()
  @IsArray()
  @IsObjectIdArray()
  tags?: string[];
}
