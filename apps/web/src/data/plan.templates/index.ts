// Template Registry (city & duration variants)
// - 개별 템플릿 파일(예: hanoi.2n3d.ts, phuquoc.3n4d.ts 등)을 유지하고,
//   여기서만 동기/비동기 접근 함수를 제공합니다.
// - 동기(getTemplate): 즉시 객체 반환 (일부 대표 템플릿은 정적 import)
// - 비동기(loadTemplate): 필요한 템플릿을 동적 import → 코드 스플리팅에 유리

// ─────────────────────────────────────────────────────────────────────────────
// 타입 정의(로컬 최소형)
// 프로젝트에 이미 "@/types/plan.template"가 있다면, 아래를 제거하고 그 타입을 import해도 됩니다.

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
    /** 템플릿 고유 ID (예: "hanoi-2n3d") */
    id: TemplateId | string;
    /** 도시 식별자 */
    city: CityId;
    /** 숙박 수 (예: 2박3일이면 nights = 2) */
    nights: number;
    /** 기본 통화 코드 (예: "VND") */
    currency: string;
    /** 기본 이동 수단 */
    defaultMode: TransportMode;
    /** 계획 예산(VND) */
    plannedBudgetVnd: number;
    /** 사람 읽기용 라벨 (선택) */
    label?: string;
  };
  /** 기본 호텔/거점(선택) */
  base?: {
    name: string;
    location: { lat: number; lng: number };
    address?: string;
  };
  /** 날짜 배열: 각 날짜별 아이템들 */
  days: Array<{
    items: ItemSeed[];
  }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// 정적 임포트(대표 템플릿 몇 개만 즉시 제공)
//  - 동기 getTemplate()에서 즉시 반환이 필요하므로 최소한의 템플릿은 정적 import로 준비
//  - 나머지는 loadTemplate()에서 동적 import로 불러옵니다.

import hanoi2n3d from "./hanoi.2n3d";
import phuquoc2n3d from "./phuquoc.2n3d";
import phuquoc3n4d from "./phuquoc.3n4d";
import danang3n4d from "./danang.3n4d";

// 존재 템플릿 목록(정적)
const STATIC_REGISTRY: Record<string, PlanTemplate> = {
  "hanoi-2n3d": hanoi2n3d,
  "phuquoc-2n3d": phuquoc2n3d,
  "phuquoc-3n4d": phuquoc3n4d,
  "danang-3n4d": danang3n4d,
};

// 도시별 기본 템플릿(“도시만” 요청됐을 때의 기본 매핑)
// - 실제 파일 유무에 맞춰 가장 근접한 기본안을 배정합니다.
// - 추후 hcm, nhatrang 템플릿이 추가되면 아래 매핑만 바꾸면 됩니다.
const DEFAULT_BY_CITY: Record<CityId, TemplateId> = {
  hanoi: "hanoi-2n3d",
  phuquoc: "phuquoc-2n3d",
  danang: "danang-3n4d",
  // 아래 두 개는 현재 파일이 없다면 임시로 가장 가까운 템플릿으로 연결
  // (차후 실제 템플릿 파일 추가 시 해당 id로 교체)
  hcm: "hanoi-2n3d",
  nhatrang: "danang-3n4d",
};

// ─────────────────────────────────────────────────────────────────────────────
// 동적 임포트 레지스트리 (코드 스플리팅)
// - 필요한 템플릿만 런타임에 청크로 로드하게 해줍니다.
const DYNAMIC_IMPORTERS: Record<string, () => Promise<{ default: PlanTemplate }>> = {
  "hanoi-2n3d": () => import("./hanoi.2n3d"),
  "phuquoc-2n3d": () => import("./phuquoc.2n3d"),
  "phuquoc-3n4d": () => import("./phuquoc.3n4d"),
  "danang-3n4d": () => import("./danang.3n4d"),
};

// ─────────────────────────────────────────────────────────────────────────────
// 유틸

/** "hanoi" 같이 도시만 들어오면 기본 변형으로 해석 ("hanoi-2n3d") */
function normalizeId(id: TemplateId): TemplateId {
  if (id.includes("-")) return id;
  return DEFAULT_BY_CITY[id as CityId] ?? id;
}

/** id가 레지스트리 내에서 사용 가능한지 */
function isKnownTemplateId(id: TemplateId): boolean {
  const nid = normalizeId(id);
  return !!(STATIC_REGISTRY[nid] || DYNAMIC_IMPORTERS[nid]);
}

// ─────────────────────────────────────────────────────────────────────────────
// 공개 API

/**
 * 동기 접근: 대표 템플릿(정적 임포트된 것)만 즉시 반환.
 * 존재하지 않으면 에러를 던집니다. (샘플 생성처럼 "즉시 필요"한 경로에서 사용)
 */
export function getTemplate(id: TemplateId): PlanTemplate {
  const nid = normalizeId(id);
  const t = STATIC_REGISTRY[nid];
  if (t) return t;
  // 정적 레지스트리에 없으면 안전하게 예외 처리
  // (이 경우는 loadTemplate(id)를 사용해야 함)
  throw new Error(`Template not statically available: ${nid}`);
}

/**
 * 비동기 접근: 모든 템플릿을 동적 import로 로드 가능.
 * 코드 스플리팅이 적용되어 초기 번들을 가볍게 유지합니다.
 */
export async function loadTemplate(id: TemplateId): Promise<PlanTemplate> {
  const nid = normalizeId(id);
  // 정적에 있으면 즉시 반환
  if (STATIC_REGISTRY[nid]) return STATIC_REGISTRY[nid];

  const importer = DYNAMIC_IMPORTERS[nid];
  if (!importer) throw new Error(`Unknown template id: ${id}`);
  const mod = await importer();
  return mod.default;
}

/**
 * 도시 기본 템플릿 id를 반환.
 * (예: "hanoi" → "hanoi-2n3d")
 */
export function getDefaultTemplateByCity(city: CityId): TemplateId {
  return DEFAULT_BY_CITY[city] ?? city;
}

/**
 * 사용 가능한 템플릿 목록을 메타와 함께 반환.
 * - 모달(샘플 선택) 등에서 라벨/도시/기간을 보여줄 때 사용
 */
export function listTemplates(): Array<{
  id: TemplateId;
  city: CityId;
  nights: number;
  label: string;
}> {
  // 정적 로드된 것만 우선 노출 (실제 파일 존재 기반)
  const ids = Object.keys(STATIC_REGISTRY) as TemplateId[];
  return ids.map((id) => {
    const t = STATIC_REGISTRY[id];
    const city = t.meta.city;
    const nights = t.meta.nights;
    const label =
      t.meta.label ??
      `${cityLabel(city)} · ${nights}박${nights + 1}일`;
    return { id: id as TemplateId, city, nights, label };
  });
}

/** 도시 라벨(한국어) */
function cityLabel(c: CityId): string {
  switch (c) {
    case "hanoi":
      return "하노이";
    case "hcm":
      return "호치민";
    case "nhatrang":
      return "나트랑";
    case "phuquoc":
      return "푸꾸옥";
    case "danang":
      return "다낭";
    default:
      return c;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 편의: 현재 Registry에 등록된 템플릿인지 점검 (디버깅용)

export function ensureTemplateAvailable(id: TemplateId): void {
  const ok = isKnownTemplateId(id);
  if (!ok) {
    // 개발 중 콘솔 경고만 띄움 (런타임 에러는 getTemplate/loadTemplate에서 처리)
    console.warn(`[plan.templates] Unknown template id requested: "${id}"`);
  }
}
