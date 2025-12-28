// firebase/functions/src/api/admin/spots.shared.ts
import * as admin from "firebase-admin";
import { db, toMillis, readRecent } from "./shared";

//   - 대표 이미지(썸네일) / 이미지 배열 / 지역 / 카테고리 필드 단일화
//   - 레거시 필드 혼재(images/imageUrls/heroImage/thumbnailUrl 등) 흡수
// -------------------------------
export function isHttpUrl(u: string) {
  const s = String(u || "").trim();
  return s.startsWith("http://") || s.startsWith("https://");
}

export function uniqStrings(list: string[]) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const v of list) {
    const s = String(v || "").trim();
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

export function toUrlFromUnknown(v: any): string | null {
  if (!v) return null;
  if (typeof v === "string") {
    const s = v.trim();
    return isHttpUrl(s) ? s : s || null;
  }
  if (typeof v === "object") {
    const u = String((v as any).url ?? (v as any).src ?? (v as any).imageUrl ?? "").trim();
    if (!u) return null;
    return isHttpUrl(u) ? u : u || null;
  }
  return null;
}

export function extractImageUrls(data: any): string[] {
  const urls: string[] = [];

  // 가장 흔한 케이스
  if (Array.isArray(data?.imageUrls)) {
    for (const it of data.imageUrls) {
      const u = toUrlFromUnknown(it);
      if (u) urls.push(u);
    }
  }

  // images가 string[] 또는 {url}[] 혼재 가능
  if (Array.isArray(data?.images)) {
    for (const it of data.images) {
      const u = toUrlFromUnknown(it);
      if (u) urls.push(u);
    }
  }

  // 단일 필드/대표 이미지 레거시
  const thumbCandidates = [
    data?.thumbnailUrl,
    data?.thumbnail,
    data?.thumbUrl,
    data?.heroImageUrl,
    data?.imageUrl,
    data?.photoUrl,
    data?.coverUrl,
    data?.coverImageUrl,
  ];
  for (const c of thumbCandidates) {
    const u = toUrlFromUnknown(c);
    if (u) urls.unshift(u);
  }

  // heroImage 객체
  const hero = data?.heroImage;
  const heroU = toUrlFromUnknown(hero);
  if (heroU) urls.unshift(heroU);

  // location.photo 등(혹시 있을 수 있음)
  const locPhoto = toUrlFromUnknown(data?.location?.photoUrl ?? data?.location?.imageUrl);
  if (locPhoto) urls.unshift(locPhoto);

  return uniqStrings(urls);
}

export function normalizeLocationIdFromDoc(data: any): string {
  const v = String(
    data?.locationId ??
      data?.region ??
      data?.location?.locationId ??
      data?.location?.region ??
      data?.location?.id ??
      ""
  ).trim();
  return v;
}

/**
 * category alias(레거시 코드) 대응: "필터 입력"에도, "응답 노출"에도 도움
 * - 여기 테이블은 최소한만 넣고, 나중에 데이터가 쌓이면 확장하면 됨.
 * - 현재 너는 "관광지"만 운영 중이라면 이걸로 충분.
 */
const CATEGORY_ALIASES: Record<string, string[]> = {
  "관광지": ["관광지", "tour", "tourism", "attraction", "sightseeing", "place"],
  "맛집": ["맛집", "restaurant", "food", "eatery"],
  "카페": ["카페", "cafe", "coffee"],
  "호텔": ["호텔", "hotel", "resort"],
  "마사지": ["마사지", "massage", "spa"],
  "바/클럽": ["바", "클럽", "bar", "club", "nightclub"],
};

export function expandCategoryFilterValues(input: string): string[] {
  const raw = String(input || "").trim();
  if (!raw || raw === "ALL") return ["ALL"];

  // exact alias match
  for (const key of Object.keys(CATEGORY_ALIASES)) {
    const list = CATEGORY_ALIASES[key];
    if (list.some((x) => String(x).toLowerCase() === raw.toLowerCase())) {
      // key(표준) + alias 모두 허용
      return uniqStrings([key, ...list]);
    }
  }

  // default: 입력값만
  return [raw];
}

export function pickCanonicalCategory(input: string): string {
  const raw = String(input || "").trim();
  if (!raw) return raw;

  for (const key of Object.keys(CATEGORY_ALIASES)) {
    const list = CATEGORY_ALIASES[key];
    if (list.some((x) => String(x).toLowerCase() === raw.toLowerCase())) return key;
  }
  return raw;
}

// -------------------------------
// ✅ Budget / PriceLevel normalization (Spots)
//   - priceLevel: 0~4 (filter/sort용, optional)
//   - budget: number (표시용, optional)
//   - budgetUnit: enum (표시용 단위, optional)
//   - budgetText: string (표시용 보조 텍스트, optional)
// -------------------------------
const BUDGET_UNIT_ALIASES: Record<string, string[]> = {
  free: ["free", "무료", "0", "없음", "no", "none"],
  ticket: ["ticket", "entry", "entrance", "입장", "입장권", "티켓", "입장료"],
  person: ["person", "per_person", "pp", "1인", "인당", "per pax", "pax"],
  meal: ["meal", "food", "1끼", "식사", "끼니", "메뉴", "meal set"],
  drink: ["drink", "beverage", "1잔", "음료", "커피", "맥주", "칵테일"],
  hour: ["hour", "per_hour", "1시간", "시간", "hourly"],
  night: ["night", "per_night", "1박", "박", "nightly"],
  table: ["table", "테이블"],
  bottle: ["bottle", "병", "1병"],
  set: ["set", "세트"],
  package: ["package", "패키지"],
};

const ALLOWED_BUDGET_UNITS = new Set(Object.keys(BUDGET_UNIT_ALIASES));

export function normalizeBudgetUnit(input: any): string | null {
  const raw = String(input ?? "").trim();
  if (!raw) return null;

  const lower = raw.toLowerCase();

  // canonical direct
  if (ALLOWED_BUDGET_UNITS.has(lower)) return lower;

  // alias match
  for (const [canon, aliases] of Object.entries(BUDGET_UNIT_ALIASES)) {
    if (aliases.some((a) => String(a).toLowerCase() === lower)) return canon;
  }

  return null;
}

export function normalizeBudget(input: any): number | null {
  if (input == null || input === "") return null;

  // number
  if (typeof input === "number") {
    if (!Number.isFinite(input)) return null;
    if (input < 0) return null;
    // 상한은 비정상 값 방지용(운영 안전)
    return Math.min(1_000_000_000, input);
  }

  const s = String(input).trim();
  if (!s) return null;

  // remove common separators ("," or "₫" etc.)
  const cleaned = s.replace(/[₫,\s]/g, "");
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  if (n < 0) return null;
  return Math.min(1_000_000_000, n);
}

export function normalizeBudgetText(input: any): string | null {
  const s = String(input ?? "").trim();
  if (!s) return null;
  // 너무 긴 텍스트는 운영/노출 CS 이슈(레이아웃 깨짐) -> 안전 상한
  return s.slice(0, 120);
}

export function normalizePriceLevel(input: any): number | null {
  if (input == null || input === "") return null;
  const n = Number(input);
  if (!Number.isFinite(n)) return null;
  const v = Math.trunc(n);
  return Math.min(4, Math.max(0, v));
}

export function hasOwn(obj: any, key: string) {
  return obj && Object.prototype.hasOwnProperty.call(obj, key);
}

/**
 * ✅ list 응답에서만 강제 정규화
 * - thumbnailUrl
 * - imageUrls (string[])
 * - images (string[])  // admin 쪽이 이걸 기대하는 경우가 많아서 같이 내려줌
 * - locationId/region 동기화
 * - categoryRaw + category(가능하면 표준으로)
 */
export function normalizeSpotForAdminList(item: any, defaultMode: "explorer" | "nightlife") {
  const data: any = item || {};
  const mode: "explorer" | "nightlife" =
    (data.mode as any) === "nightlife" || defaultMode === "nightlife" ? "nightlife" : "explorer";

  const imageUrls = extractImageUrls(data);
  const thumbnailUrl = String(data.thumbnailUrl || "").trim() || (imageUrls[0] ?? null);

  const locationId = normalizeLocationIdFromDoc(data);
  const region = String(data.region || "").trim() || locationId;

  const categoryRaw = String(data.category ?? "").trim();
  const category = categoryRaw ? pickCanonicalCategory(categoryRaw) : categoryRaw;

  // ✅ 가격/예산 필드 표준화(운영 안정)
  const priceLevel = normalizePriceLevel((data as any).priceLevel ?? (data as any).price_level ?? (data as any).priceTier ?? (data as any).price_tier);
  const budget = normalizeBudget((data as any).budget ?? (data as any).budgetVnd ?? (data as any).budget_vnd);
  const budgetUnit = normalizeBudgetUnit((data as any).budgetUnit ?? (data as any).budget_unit);
  const budgetText = normalizeBudgetText((data as any).budgetText ?? (data as any).budget_text);

  return {
    ...data,
    mode,
    // ✅ 표준 이미지 필드
    imageUrls,
    images: imageUrls,
    thumbnailUrl,
    // ✅ 표준 지역 필드(양쪽 다 채워서 프론트가 덜 헷갈리게)
    locationId: locationId || null,
    region: region || null,
    // ✅ 표준 카테고리
    category,
    categoryRaw: categoryRaw || null,

    // ✅ 신규 표준 필드(프론트/운영 공통)
    priceLevel,
    budget,
    budgetUnit,
    budgetText,
  };
}

// -------------------------------
// Cursor Pagination helpers (Spots)
// -------------------------------
export type SpotMode = "all" | "explorer" | "nightlife";
export type SortField = "updatedAt" | "createdAt";

export type SpotCursorSingle = {
  v: 1;
  mode: Exclude<SpotMode, "all">;
  sortField: SortField;
  sortAt: number; // millis
  id: string;
};

export type SpotCursorAll = {
  v: 1;
  mode: "all";
  sortField: SortField;
  cursors: {
    spots?: { sortAt: number; id: string } | null;
    adult_spots?: { sortAt: number; id: string } | null;
  };
};

export type SpotCursor = SpotCursorSingle | SpotCursorAll;

export function clampInt(n: any, min: number, max: number, fallback: number) {
  const v = Number.isFinite(Number(n)) ? Number(n) : fallback;
  return Math.min(max, Math.max(min, Math.trunc(v)));
}

export function safeJsonParse(s: string): any | null {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

export function parseSpotCursor(raw: any): SpotCursor | null {
  if (!raw) return null;
  const str = String(raw).trim();
  if (!str) return null;

  // 1) JSON 직접
  const obj = safeJsonParse(str);
  if (obj && typeof obj === "object") {
    // 최소 검증
    if (obj.mode === "all") {
      const sortField: SortField = obj.sortField === "createdAt" ? "createdAt" : "updatedAt";
      const cursors = obj.cursors && typeof obj.cursors === "object" ? obj.cursors : {};
      const cA = cursors.spots && cursors.spots.id ? { sortAt: Number(cursors.spots.sortAt || 0), id: String(cursors.spots.id) } : null;
      const cB =
        cursors.adult_spots && cursors.adult_spots.id ? { sortAt: Number(cursors.adult_spots.sortAt || 0), id: String(cursors.adult_spots.id) } : null;
      return { v: 1, mode: "all", sortField, cursors: { spots: cA, adult_spots: cB } };
    }

    if (obj.mode === "explorer" || obj.mode === "nightlife") {
      const sortField: SortField = obj.sortField === "createdAt" ? "createdAt" : "updatedAt";
      const sortAt = Number(obj.sortAt || 0);
      const id = String(obj.id || "").trim();
      if (!id || !Number.isFinite(sortAt)) return null;
      return { v: 1, mode: obj.mode, sortField, sortAt, id };
    }
  }

  // 2) 그냥 문자열이면 (레거시/외부) -> 무시
  return null;
}

export function encodeSpotCursorSingle(mode: "explorer" | "nightlife", sortField: SortField, sortAt: number, id: string): string {
  const payload: SpotCursorSingle = { v: 1, mode, sortField, sortAt, id };
  return JSON.stringify(payload);
}

export function encodeSpotCursorAll(sortField: SortField, cursors: SpotCursorAll["cursors"]): string {
  const payload: SpotCursorAll = { v: 1, mode: "all", sortField, cursors };
  return JSON.stringify(payload);
}

export function sortKeyFromDoc(data: any, sortField: SortField): number {
  const m = toMillis(data?.[sortField]);
  if (m != null) return m;
  // fallback tie-breaker: createdAt/updatedAt 모두 없을 때 0
  const alt = toMillis(data?.updatedAt) ?? toMillis(data?.createdAt);
  return alt ?? 0;
}

export function compareBySortDesc(a: { sortAt: number; id: string }, b: { sortAt: number; id: string }) {
  if (b.sortAt !== a.sortAt) return b.sortAt - a.sortAt;
  // id desc (documentId를 desc로 두는 것과 동일한 방향)
  if (b.id === a.id) return 0;
  return b.id > a.id ? 1 : -1;
}

export async function fetchSpotsPageFromCollection(params: {
  colName: string;
  defaultMode: "explorer" | "nightlife";
  sortField: SortField;
  region: string; // locationId 기준(대량 데이터에서는 locationId 백필 권장)
  category: string;
  limit: number;
  cursor?: { sortAt: number; id: string } | null;
}): Promise<{
  items: Array<{ id: string; mode: "explorer" | "nightlife"; _sortAt: number; [k: string]: any }>;
  hasNext: boolean;
  nextCursor: { sortAt: number; id: string } | null;
  approximate: boolean;
}> {
  const { colName, defaultMode, sortField, region, category, limit, cursor } = params;

  const per = Math.max(1, Math.min(200, limit));
  const take = per + 1;

  const categoryValues = category === "ALL" ? ["ALL"] : expandCategoryFilterValues(category);
  const useCategoryMulti = categoryValues.length > 1;

  const applyMemoryFilters = (list: any[]) => {
    let out = list;

    // region: locationId/region 혼재 대응
    if (region !== "ALL") {
      out = out.filter((s: any) => {
        const v = String(s.locationId || s.region || "");
        return v === region;
      });
    }

    // category: alias 대응(레거시)
    if (category !== "ALL") {
      const allowed = new Set(categoryValues.map((x) => String(x)));
      out = out.filter((s: any) => allowed.has(String(s.category || "")));
    }

    return out;
  };

  const pack = (docs: FirebaseFirestore.QueryDocumentSnapshot[]) =>
    docs.map((d) => {
      const data: any = d.data() || {};
      const mode: "explorer" | "nightlife" =
        (data.mode as any) === "nightlife" || colName === "adult_spots" ? "nightlife" : "explorer";
      const _sortAt = sortKeyFromDoc(data, sortField);

      // ✅ list 응답에 필요한 표준 필드 강제 주입
      const normalized = normalizeSpotForAdminList({ id: d.id, ...data, mode: data.mode ?? mode }, defaultMode);

      return { ...normalized, id: d.id, mode: normalized.mode ?? mode, _sortAt };
    });

  // 1) 정석: Firestore cursor query (대량 데이터 대응)
  try {
    const baseCol = db.collection(colName);

    const regionFields = region !== "ALL" ? (["locationId", "region"] as const) : (["locationId"] as const);

    // category alias가 여러 개인 경우, query를 몇 개만 수행하고 나머지는 메모리에서 보정(너무 많은 쿼리 방지)
    const categoryQueryValues =
      category === "ALL" ? [null] : categoryValues.slice(0, 2).map((v) => (v === "ALL" ? null : v));

    type QSpec = { regionField: "locationId" | "region"; categoryValue: string | null };

    const specs: QSpec[] = [];
    for (const rf of regionFields) {
      for (const cv of categoryQueryValues) {
        specs.push({ regionField: rf, categoryValue: cv });
      }
    }

    // 쿼리 최대 4개(2 region fields x 2 category values)
    const buildQuery = (spec: QSpec) => {
      let q: FirebaseFirestore.Query = baseCol;

      if (region !== "ALL") q = q.where(spec.regionField, "==", region);
      if (spec.categoryValue) q = q.where("category", "==", spec.categoryValue);

      q = q.orderBy(sortField, "desc").orderBy(admin.firestore.FieldPath.documentId(), "desc");

      if (cursor?.id && Number.isFinite(cursor.sortAt)) {
        const ts = admin.firestore.Timestamp.fromMillis(Number(cursor.sortAt));
        q = q.startAfter(ts as any, cursor.id as any);
      }

      return q.limit(take);
    };

    const snaps = await Promise.all(specs.map((s) => buildQuery(s).get()));

    // merge & dedup
    const mergedDocs: FirebaseFirestore.QueryDocumentSnapshot[] = [];
    const seen = new Set<string>();
    for (const snap of snaps) {
      for (const d of snap.docs) {
        if (seen.has(d.id)) continue;
        seen.add(d.id);
        mergedDocs.push(d);
      }
    }

    let packed = pack(mergedDocs);

    // query로 못 걸러진 alias/필드 혼재는 메모리에서 한번 더 보정
    packed = applyMemoryFilters(packed);

    // cursor가 있더라도 혹시 data에 sortField가 없는 문서가 섞일 수 있으니 서버에서 한 번 더 정렬 안정화
    packed.sort((a, b) => compareBySortDesc({ sortAt: a._sortAt, id: a.id }, { sortAt: b._sortAt, id: b.id }));

    const pagePlusOne = packed.slice(0, take);
    const hasNext = pagePlusOne.length > per;
    const pageItems = hasNext ? pagePlusOne.slice(0, per) : pagePlusOne;

    const last = pageItems.length ? pageItems[pageItems.length - 1] : null;
    const nextCursor = last ? { sortAt: last._sortAt, id: last.id } : null;

    const approximate = region !== "ALL" || useCategoryMulti || specs.length > 1;

    return { items: pageItems, hasNext, nextCursor, approximate };
  } catch (e) {
    // 2) fallback: 인덱스/필드 불일치 시에도 화면이 죽지 않게 "최근 N개 스캔 후 메모리 필터/정렬/커서" (정확도 제한)
    console.warn(`[admin/spots] query failed on ${colName} (${sortField}). fallback scan.`, e);
  }

  // fallback scan window (운영에서 너무 크게 잡지 않음)
  const scanMax = Math.min(2000, Math.max(400, per * 12));
  const recentSnap = await readRecent(colName, scanMax);
  let list = pack(recentSnap.docs);

  // 메모리 필터
  list = applyMemoryFilters(list);

  // 정렬
  list.sort((a, b) => compareBySortDesc({ sortAt: a._sortAt, id: a.id }, { sortAt: b._sortAt, id: b.id }));

  // cursor 적용(메모리)
  let startIdx = 0;
  if (cursor?.id && Number.isFinite(cursor.sortAt)) {
    const idx = list.findIndex((x) => x.id === cursor.id && x._sortAt === Number(cursor.sortAt));
    if (idx >= 0) startIdx = idx + 1;
    else {
      // 커서를 못 찾으면 "커서보다 뒤(older)"로 추정 이동
      startIdx = list.findIndex(
        (x) => compareBySortDesc({ sortAt: Number(cursor.sortAt), id: cursor.id }, { sortAt: x._sortAt, id: x.id }) < 0
      );
      if (startIdx < 0) startIdx = 0;
    }
  }

  const window = list.slice(startIdx, startIdx + per + 1);
  const hasNext = window.length > per;
  const pageItems = hasNext ? window.slice(0, per) : window;
  const last = pageItems.length ? pageItems[pageItems.length - 1] : null;
  const nextCursor = last ? { sortAt: last._sortAt, id: last.id } : null;

  return { items: pageItems, hasNext, nextCursor, approximate: true };
}
