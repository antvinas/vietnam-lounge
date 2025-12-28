// apps/web/src/features/plan/data/templates/index.ts

import hanoi3n4d from "./hanoi.3n4d";
import phuquoc3n4d from "./phuquoc.3n4d";
import danang3n4d from "./danang.3n4d";
import nhatrang3n4d from "./nhatrang.3n4d";

import type { PlanTemplate, TemplateId, CityId } from "@/types/plan.template";

// [정적 레지스트리]
const STATIC_REGISTRY: Record<string, PlanTemplate> = {
  "hanoi-3n4d": hanoi3n4d as unknown as PlanTemplate, // 🟢 타입 단언으로 호환성 강제
  "phuquoc-3n4d": phuquoc3n4d as unknown as PlanTemplate,
  "danang-3n4d": danang3n4d as unknown as PlanTemplate,
  "nhatrang-3n4d": nhatrang3n4d as unknown as PlanTemplate,
};

// [기본 매핑]
const DEFAULT_BY_CITY: Record<string, TemplateId> = { // 키 타입을 string으로 완화
  hanoi: "hanoi-3n4d",
  phuquoc: "phuquoc-3n4d",
  danang: "danang-3n4d",
  nhatrang: "nhatrang-3n4d",
  hcm: "danang-3n4d",
  
  // 대문자 키 호환
  "Hanoi": "hanoi-3n4d",
  "Phu Quoc": "phuquoc-3n4d",
  "Da Nang": "danang-3n4d",
  "Nha Trang": "nhatrang-3n4d",
};

// [동적 임포터]
const DYNAMIC_IMPORTERS: Record<string, () => Promise<{ default: any }>> = {
  "hanoi-3n4d": () => import("./hanoi.3n4d"),
  "phuquoc-3n4d": () => import("./phuquoc.3n4d"),
  "danang-3n4d": () => import("./danang.3n4d"),
  "nhatrang-3n4d": () => import("./nhatrang.3n4d"),
};

function normalizeId(id: string): TemplateId {
  if (id.includes("-")) return id as TemplateId;
  return DEFAULT_BY_CITY[id] ?? (id as TemplateId);
}

// --- API ---

export function getTemplate(id: string): PlanTemplate {
  const nid = normalizeId(id);
  const t = STATIC_REGISTRY[nid];
  if (t) return t;
  throw new Error(`Template not statically available: ${nid}`);
}

export async function loadTemplate(id: string): Promise<PlanTemplate> {
  const nid = normalizeId(id);
  if (STATIC_REGISTRY[nid]) return STATIC_REGISTRY[nid];
  
  const importer = DYNAMIC_IMPORTERS[nid];
  if (!importer) throw new Error(`Unknown template id: ${id}`);
  
  const mod = await importer();
  return mod.default as PlanTemplate;
}

export function getDefaultTemplateByCity(city: CityId): TemplateId {
  return DEFAULT_BY_CITY[city as string] ?? (city as unknown as TemplateId);
}

export function listTemplates(): Array<{
  id: TemplateId;
  city: CityId;
  nights: number;
  label: string;
}> {
  const ids = Object.keys(STATIC_REGISTRY) as TemplateId[];
  return ids.map((id) => {
    const t = STATIC_REGISTRY[id];
    const city = t.meta.city;
    const nights = t.meta.nights;
    const label = t.meta.title ?? `${city} ${nights}박`;
    return { id, city, nights, label };
  });
}