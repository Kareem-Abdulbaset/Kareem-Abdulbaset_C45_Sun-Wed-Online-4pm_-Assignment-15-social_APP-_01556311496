import { AppError } from "../utils/AppError";

const readImages = (value: unknown) => {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new AppError("Images must be an array", 400);
  }

  return value.map((image) => {
    if (typeof image !== "string" || !image.trim()) {
      throw new AppError("Every image must be a text url", 400);
    }

    return image.trim();
  });
};

export const createPostSchema = (body: any) => {
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  const images = readImages(body?.images);

  if (!content) {
    throw new AppError("Content is required", 400);
  }

  if (content.length > 2000) {
    throw new AppError("Content must be less than 2000 characters", 400);
  }

  return {
    content,
    images
  };
};

export const updatePostSchema = (body: any) => {
  const data: {
    content?: string;
    images?: string[];
  } = {};

  if (body?.content !== undefined) {
    const content = typeof body.content === "string" ? body.content.trim() : "";

    if (!content) {
      throw new AppError("Content is required", 400);
    }

    if (content.length > 2000) {
      throw new AppError("Content must be less than 2000 characters", 400);
    }

    data.content = content;
  }

  if (body?.images !== undefined) {
    data.images = readImages(body.images);
  }

  if (!data.content && data.images === undefined) {
    throw new AppError("No data to update", 400);
  }

  return data;
};
