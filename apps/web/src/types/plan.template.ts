// src/types/plan.template.ts

// 도시 ID (소문자 기준 통일, 기존 대문자도 허용하여 호환성 확보)
export type CityId = 
  | "hanoi" | "hcm" | "nhatrang" | "phuquoc" | "danang"
  | "Hanoi" | "Ho Chi Minh" | "Nha Trang" | "Phu Quoc" | "Da Nang"; // 🟢 호환성 추가

// 템플릿 ID
export type TemplateId =
  | "phuquoc-3n4d"
  | "phuquoc-2n3d"
  | "hanoi-2n3d"
  | "hanoi-3n4d"
  | "danang-3n4d"
  | "nhatrang-3n4d";

export type TransportMode = "walk" | "car" | "transit" | "bike";

export type ItemSeed = {
  id?: string;
  kind: "spot" | "meal" | "activity";
  name: string;
  note?: string;
  location: { lat: number; lng: number };
  timeStartMin?: number;
  timeEndMin?: number;
  openMin?: number;
  closeMin?: number;
  costVnd?: number;
  modeHint?: TransportMode;
};

export type DaySeed = {
  label?: string;
  items: ItemSeed[];
};

export type TemplateMeta = {
  id: TemplateId;
  city: CityId;
  title: string;
  nights: number;
  defaultMode: TransportMode;
  currency: "VND";
  plannedBudgetVnd: number;
  summary: string;
  label?: string;
};

export type PlanTemplate = {
  meta: TemplateMeta;
  base?: { 
    name: string; 
    location: { lat: number; lng: number };
    address?: string; 
  }; 
  days: DaySeed[];
};

export type SampleGenOptions = {
  templateId?: TemplateId;
  startDate?: string;
  nights?: number;
  currency?: "VND";
  baseHotel?: { name: string; lat: number; lng: number; address?: string };
  isSample?: boolean;
};

export type GeneratedPlan = {
  trip: any;
  days: any[];
  items: any[];
  links: any[];
};