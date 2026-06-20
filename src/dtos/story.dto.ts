import { Transform } from "class-transformer";
import { IsArray, IsIn, IsOptional, IsString, MaxLength, ValidateIf } from "class-validator";
import { IsNonEmptyStringArray, IsNotBlank } from "../common/decorators/validation.decorators";
import { toTrimmedString, toTrimmedStringArray } from "../common/transforms";
import { reactionTypes } from "../utils/reaction";

const hasMedia = (dto: { media?: unknown[] }) => {
  return Array.isArray(dto.media) && dto.media.length > 0;
};

export class StoryDto {
  @ValidateIf((dto: StoryDto) => !hasMedia(dto))
  @Transform(toTrimmedString)
  @IsString()
  @IsNotBlank({ message: "Content or media is required" })
  @MaxLength(500)
  content?: string;

  @IsOptional()
  @Transform(toTrimmedStringArray)
  @IsArray()
  @IsNonEmptyStringArray()
  media?: string[];
}

export class StoryReactionDto {
  @Transform(toTrimmedString)
  @IsString()
  @IsNotBlank()
  @IsIn(reactionTypes)
  type!: string;
}
