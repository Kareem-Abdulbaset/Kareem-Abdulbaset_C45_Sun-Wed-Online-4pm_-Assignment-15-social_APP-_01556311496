import { Types } from "mongoose";
import { registerDecorator, ValidationArguments, ValidationOptions } from "class-validator";

const isBlank = (value: unknown) => {
  return typeof value !== "string" || !value.trim();
};

export const isObjectId = (value: unknown) => {
  return typeof value === "string" && Types.ObjectId.isValid(value);
};

export function IsNotBlank(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isNotBlank",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return !isBlank(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must not be empty`;
        }
      }
    });
  };
}

export function IsObjectId(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isObjectId",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return isObjectId(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid id`;
        }
      }
    });
  };
}

export function IsNonEmptyStringArray(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isNonEmptyStringArray",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return Array.isArray(value) && value.every((item) => !isBlank(item));
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must contain text values`;
        }
      }
    });
  };
}

export function IsObjectIdArray(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isObjectIdArray",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return Array.isArray(value) && value.every((item) => isObjectId(item));
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must contain valid ids`;
        }
      }
    });
  };
}
