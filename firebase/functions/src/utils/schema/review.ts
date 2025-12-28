import { z } from "zod";

export const ReviewCreateSchema = z.object({
  spotId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  content: z.string().min(10).max(3000),
  photos: z.array(z.string().url()).max(8).optional(),
  nickname: z.string().max(30).optional(),
});

export const ReviewListQuerySchema = z.object({
  spotId: z.string().min(1),
  sort: z.enum(["latest", "highest", "lowest"]).optional().default("latest"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const ReviewReportSchema = z.object({
  spotId: z.string().min(1),
  reviewId: z.string().min(1),
  reason: z.string().max(200).optional(),
});
