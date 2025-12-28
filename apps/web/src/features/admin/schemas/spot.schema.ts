// src/features/admin/schemas/spot.schema.ts
import { z } from "zod";

export const CATEGORIES = {
  explorer: ["맛집", "카페", "관광명소", "쇼핑", "액티비티", "스파/마사지", "기타"],
  nightlife: ["클럽", "바/펍", "가라오케", "마사지(Night)", "라운지", "이벤트", "기타"],
} as const;

export const spotSchema = z.object({
  name: z.string().min(1, "장소명은 필수입니다."),
  locationId: z.string().min(1, "지역을 선택해주세요."),
  
  mode: z.enum(["explorer", "nightlife"]).default("explorer"),
  category: z.string().min(1, "카테고리를 선택해주세요."),
  
  address: z.string().optional(),
  description: z.string().optional(),
  phone: z.string().optional(),
  openHours: z.string().optional(),
  
  // 🟢 문자열로 들어와도 숫자로 변환
  priceLevel: z.coerce.number().min(1).max(5).default(1),
  rating: z.coerce.number().min(0).max(5).default(0),
  
  averageSpend: z.string().optional(),
  keywords: z.string().optional(),

  // 🟢 위도/경도 강제 변환
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),

  isSponsored: z.boolean().optional(),
  sponsorLevel: z.enum(["platinum", "gold", "silver"]).optional(),
  sponsorExpiry: z.string().optional(),
  sponsorLabel: z.string().optional(),

  images: z.array(z.object({ url: z.string(), caption: z.string().optional() })).optional().default([]),
  menuImages: z.array(z.string()).optional(),
});

export type SpotFormValues = z.infer<typeof spotSchema>;