// apps/web/src/features/plan/data/index.ts

import hanoi3n4d from "./hanoi.3n4d";
import phuquoc3n4d from "./phuquoc.3n4d";
import danang3n4d from "./danang.3n4d";
import nhatrang3n4d from "./nhatrang.3n4d"; // [신규]

// 타입 정의
export type CityId = "hanoi" | "hcm" | "nhatrang" | "phuquoc" | "danang";
export type VariantId = "2n3d" | "3n4d";
export type TemplateId = CityId | `${CityId}-${VariantId}`;
export type TransportMode = "walk" | "car" | "transit" | "bike";

export interface ItemSeed {
  kind: "spot" | "meal" | "activity";
  name: string;
  location: { lat: number; lng: number };
  timeStartMin?: number;
  timeEndMin?: number;
  costVnd?: number;
  note?: string;
}

export interface PlanTemplate {
  meta: {
    id: TemplateId | string;
    city: CityId;
    nights: number;
    currency: string;
    defaultMode: TransportMode;
    plannedBudgetVnd: number;
    label?: string;
    title?: string;
    summary?: string;
  };
  base?: {
    name: string;
    location: { lat: number; lng: number };
    address?: string;
  };
  days: Array<{
    label?: string;
    items: ItemSeed[];
  }>;
}

// [정적 레지스트리] - 모두 3n4d(3박4일)로 통일
const STATIC_REGISTRY: Record<string, PlanTemplate> = {
  "hanoi-3n4d": hanoi3n4d,
  "phuquoc-3n4d": phuquoc3n4d,
  "danang-3n4d": danang3n4d,
  "nhatrang-3n4d": nhatrang3n4d,
};

// [기본 매핑] 도시 이름만으로 요청 시 연결될 템플릿
const DEFAULT_BY_CITY: Record<CityId, TemplateId> = {
  hanoi: "hanoi-3n4d",
  phuquoc: "phuquoc-3n4d",
  danang: "danang-3n4d",
  nhatrang: "nhatrang-3n4d",
  // 호치민은 아직 파일이 없으므로 가장 가까운 다낭으로 임시 연결
  hcm: "danang-3n4d",
};

// [동적 임포터]
const DYNAMIC_IMPORTERS: Record<string, () => Promise<{ default: PlanTemplate }>> = {
  "hanoi-3n4d": () => import("./hanoi.3n4d"),
  "phuquoc-3n4d": () => import("./phuquoc.3n4d"),
  "danang-3n4d": () => import("./danang.3n4d"),
  "nhatrang-3n4d": () => import("./nhatrang.3n4d"),
};

function normalizeId(id: TemplateId): TemplateId {
  if (id.includes("-")) return id;
  return DEFAULT_BY_CITY[id as CityId] ?? id;
}

function isKnownTemplateId(id: TemplateId): boolean {
  const nid = normalizeId(id);
  return !!(STATIC_REGISTRY[nid] || DYNAMIC_IMPORTERS[nid]);
}

// --- API ---

export function getTemplate(id: TemplateId): PlanTemplate {
  const nid = normalizeId(id);
  const t = STATIC_REGISTRY[nid];
  if (t) return t;
  throw new Error(`Template not statically available: ${nid}`);
}

export async function loadTemplate(id: TemplateId): Promise<PlanTemplate> {
  const nid = normalizeId(id);
  if (STATIC_REGISTRY[nid]) return STATIC_REGISTRY[nid];
  const importer = DYNAMIC_IMPORTERS[nid];
  if (!importer) throw new Error(`Unknown template id: ${id}`);
  const mod = await importer();
  return mod.default;
}

export function getDefaultTemplateByCity(city: CityId): TemplateId {
  return DEFAULT_BY_CITY[city] ?? city;
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
    return { id: id as TemplateId, city, nights, label };
  });
}