import { plainToInstance } from "class-transformer";
import { validateSync, ValidationError } from "class-validator";
import { NextFunction, Request, RequestHandler, Response } from "express";
import { AppError } from "../../utils/AppError";

type RequestSource = "body" | "query" | "params";
type DtoClass<T extends object> = new () => T;

type ValidationPipeOptions = {
  source?: RequestSource;
  requireAtLeastOne?: boolean;
};

const flattenValidationErrors = (errors: ValidationError[], parent = ""): Array<{ path: string; message: string }> => {
  return errors.flatMap((error) => {
    const path = parent ? `${parent}.${error.property}` : error.property;
    const messages = Object.values(error.constraints || {}).map((message) => ({
      path,
      message
    }));

    return [
      ...messages,
      ...flattenValidationErrors(error.children || [], path)
    ];
  });
};

const hasAnyValue = (value: object) => {
  return Object.values(value).some((item) => item !== undefined);
};

export class ValidationPipe<T extends object> {
  private readonly source: RequestSource;

  constructor(
    private readonly dto: DtoClass<T>,
    private readonly options: ValidationPipeOptions = {}
  ) {
    this.source = options.source || "body";
  }

  transform(value: unknown) {
    const input = value && typeof value === "object" ? value : {};
    const instance = plainToInstance(this.dto, input, {
      enableImplicitConversion: true,
      exposeDefaultValues: true
    });

    const errors = validateSync(instance, {
      whitelist: true,
      forbidNonWhitelisted: false,
      stopAtFirstError: false,
      validationError: {
        target: false,
        value: false
      }
    });

    if (errors.length) {
      throw new AppError("Validation failed", 400, flattenValidationErrors(errors));
    }

    if (this.options.requireAtLeastOne && !hasAnyValue(instance)) {
      throw new AppError("No data to update", 400, [
        {
          path: this.source,
          message: "At least one field is required"
        }
      ]);
    }

    return instance;
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

export const validateBody = <T extends object>(dto: DtoClass<T>, options: Omit<ValidationPipeOptions, "source"> = {}) => {
  return new ValidationPipe(dto, { ...options, source: "body" }).middleware();
};

export const validateParams = <T extends object>(dto: DtoClass<T>) => {
  return new ValidationPipe(dto, { source: "params" }).middleware();
};
