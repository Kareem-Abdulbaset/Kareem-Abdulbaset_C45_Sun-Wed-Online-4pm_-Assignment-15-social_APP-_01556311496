import { Transform } from "class-transformer";
import { IsObjectId } from "../common/decorators/validation.decorators";
import { toTrimmedString } from "../common/transforms";

export class IdParamDto {
  @Transform(toTrimmedString)
  @IsObjectId({ message: "Invalid id" })
  id!: string;
}

export class UserIdParamDto {
  @Transform(toTrimmedString)
  @IsObjectId({ message: "Invalid user id" })
  userId!: string;
}

export class PostIdParamDto {
  @Transform(toTrimmedString)
  @IsObjectId({ message: "Invalid post id" })
  postId!: string;
}
