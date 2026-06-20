import { TransformFnParams } from "class-transformer";

export const toTrimmedString = ({ value }: TransformFnParams) => {
  return typeof value === "string" ? value.trim() : value;
};

export const toOptionalTrimmedString = ({ value }: TransformFnParams) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();

  return trimmed || undefined;
};

export const toLowerTrimmedString = ({ value }: TransformFnParams) => {
  return typeof value === "string" ? value.toLowerCase().trim() : value;
};

export const toTrimmedStringArray = ({ value }: TransformFnParams) => {
  if (!Array.isArray(value)) {
    return value;
  }

  return value.map((item) => (typeof item === "string" ? item.trim() : item));
};

export const toBoolean = ({ value }: TransformFnParams) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true") {
      return true;
    }

    if (normalized === "false") {
      return false;
    }
  }

  return value;
};
