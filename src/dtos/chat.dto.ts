import { Transform } from "class-transformer";
import { IsArray, IsOptional, IsString, MaxLength, ValidateIf } from "class-validator";
import { IsNotBlank, IsObjectId, IsObjectIdArray } from "../common/decorators/validation.decorators";
import { toTrimmedString } from "../common/transforms";

export class CreatePrivateChatDto {
  @ValidateIf((dto: CreatePrivateChatDto) => !dto.userId)
  @Transform(toTrimmedString)
  @IsObjectId({ message: "Receiver id must be valid" })
  receiverId?: string;

  @ValidateIf((dto: CreatePrivateChatDto) => !dto.receiverId)
  @Transform(toTrimmedString)
  @IsObjectId({ message: "Receiver id must be valid" })
  userId?: string;
}

export class SendPrivateMessageDto extends CreatePrivateChatDto {
  @ValidateIf((dto: SendPrivateMessageDto) => !dto.message)
  @Transform(toTrimmedString)
  @IsString()
  @IsNotBlank({ message: "Message is required" })
  @MaxLength(1000)
  text?: string;

  @ValidateIf((dto: SendPrivateMessageDto) => !dto.text)
  @Transform(toTrimmedString)
  @IsString()
  @IsNotBlank({ message: "Message is required" })
  @MaxLength(1000)
  message?: string;
}

export class CreateGroupChatDto {
  @Transform(toTrimmedString)
  @IsString()
  @IsNotBlank({ message: "Group name is required" })
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsArray()
  @IsObjectIdArray()
  users?: string[];
}

export class SendChatMessageDto {
  @ValidateIf((dto: SendChatMessageDto) => !dto.message)
  @Transform(toTrimmedString)
  @IsString()
  @IsNotBlank({ message: "Message is required" })
  @MaxLength(1000)
  text?: string;

  @ValidateIf((dto: SendChatMessageDto) => !dto.text)
  @Transform(toTrimmedString)
  @IsString()
  @IsNotBlank({ message: "Message is required" })
  @MaxLength(1000)
  message?: string;
}
