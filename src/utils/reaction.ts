import { AppError } from "./AppError";

export const reactionTypes = ["like", "love", "care", "haha", "wow", "sad", "angry"] as const;

export type ReactionType = (typeof reactionTypes)[number];

export const readReactionType = (value: unknown) => {
  if (typeof value !== "string" || !reactionTypes.includes(value as ReactionType)) {
    throw new AppError("Reaction type is invalid", 400);
  }

  return value as ReactionType;
};
