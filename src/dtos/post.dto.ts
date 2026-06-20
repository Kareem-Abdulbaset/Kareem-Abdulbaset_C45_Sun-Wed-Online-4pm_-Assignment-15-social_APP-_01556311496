import { z } from "zod";

const imagesSchema = z.array(z.string().trim().min(1, "Every image must be a text url"));

export const createPostDtoSchema = z.object({
  content: z.string().trim().min(1, "Content is required").max(2000, "Content must be less than 2000 characters"),
  images: imagesSchema.optional().default([])
});

export const updatePostDtoSchema = z
  .object({
    content: z.string().trim().min(1, "Content is required").max(2000, "Content must be less than 2000 characters").optional(),
    images: imagesSchema.optional()
  })
  .refine((value) => value.content !== undefined || value.images !== undefined, {
    message: "No data to update"
  });

export type CreatePostDto = z.infer<typeof createPostDtoSchema>;
export type UpdatePostDto = z.infer<typeof updatePostDtoSchema>;
