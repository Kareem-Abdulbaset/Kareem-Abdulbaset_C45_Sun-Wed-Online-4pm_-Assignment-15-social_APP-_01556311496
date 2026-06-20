import { NextFunction, Request, RequestHandler, Response } from "express";
import { z, ZodTypeAny } from "zod";
import { AppError } from "../../utils/AppError";

type RequestSource = "body" | "query" | "params";

export class ZodValidationPipe {
  constructor(
    private readonly schema: ZodTypeAny,
    private readonly source: RequestSource = "body"
  ) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      throw new AppError("Validation failed", 400, z.treeifyError(result.error));
    }

    return result.data;
  }

  middleware(): RequestHandler {
    return (req: Request, _res: Response, next: NextFunction) => {
      try {
        (req as any)[this.source] = this.transform((req as any)[this.source]);
        next();
      } catch (error) {
        next(error);
      }
    };
  }
}

export const validateBodyWithZod = (schema: ZodTypeAny) => {
  return new ZodValidationPipe(schema, "body").middleware();
};
