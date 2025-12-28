"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.isHttpUrl = isHttpUrl;
exports.uniqStrings = uniqStrings;
exports.toUrlFromUnknown = toUrlFromUnknown;
exports.extractImageUrls = extractImageUrls;
exports.normalizeLocationIdFromDoc = normalizeLocationIdFromDoc;
exports.expandCategoryFilterValues = expandCategoryFilterValues;
exports.pickCanonicalCategory = pickCanonicalCategory;
exports.normalizeBudgetUnit = normalizeBudgetUnit;
exports.normalizeBudget = normalizeBudget;
exports.normalizeBudgetText = normalizeBudgetText;
exports.normalizePriceLevel = normalizePriceLevel;
exports.hasOwn = hasOwn;
exports.normalizeSpotForAdminList = normalizeSpotForAdminList;
exports.clampInt = clampInt;
exports.safeJsonParse = safeJsonParse;
exports.parseSpotCursor = parseSpotCursor;
exports.encodeSpotCursorSingle = encodeSpotCursorSingle;
exports.encodeSpotCursorAll = encodeSpotCursorAll;
exports.sortKeyFromDoc = sortKeyFromDoc;
exports.compareBySortDesc = compareBySortDesc;
exports.fetchSpotsPageFromCollection = fetchSpotsPageFromCollection;
// firebase/functions/src/api/admin/spots.shared.ts
const admin = __importStar(require("firebase-admin"));
const shared_1 = require("./shared");
//   - 대표 이미지(썸네일) / 이미지 배열 / 지역 / 카테고리 필드 단일화
//   - 레거시 필드 혼재(images/imageUrls/heroImage/thumbnailUrl 등) 흡수
// -------------------------------
function isHttpUrl(u) {
    const s = String(u || "").trim();
    return s.startsWith("http://") || s.startsWith("https://");
}
function uniqStrings(list) {
    const out = [];
    const seen = new Set();
    for (const v of list) {
        const s = String(v || "").trim();
        if (!s)
            continue;
        if (seen.has(s))
            continue;
        seen.add(s);
        out.push(s);
    }
    return out;
}
function toUrlFromUnknown(v) {
    var _a, _b, _c;
    if (!v)
        return null;
    if (typeof v === "string") {
        const s = v.trim();
        return isHttpUrl(s) ? s : s || null;
    }
    if (typeof v === "object") {
        const u = String((_c = (_b = (_a = v.url) !== null && _a !== void 0 ? _a : v.src) !== null && _b !== void 0 ? _b : v.imageUrl) !== null && _c !== void 0 ? _c : "").trim();
        if (!u)
            return null;
        return isHttpUrl(u) ? u : u || null;
    }
    return null;
}
function extractImageUrls(data) {
    var _a, _b, _c;
    const urls = [];
    // 가장 흔한 케이스
    if (Array.isArray(data === null || data === void 0 ? void 0 : data.imageUrls)) {
        for (const it of data.imageUrls) {
            const u = toUrlFromUnknown(it);
            if (u)
                urls.push(u);
        }
    }
    // images가 string[] 또는 {url}[] 혼재 가능
    if (Array.isArray(data === null || data === void 0 ? void 0 : data.images)) {
        for (const it of data.images) {
            const u = toUrlFromUnknown(it);
            if (u)
                urls.push(u);
        }
    }
    // 단일 필드/대표 이미지 레거시
    const thumbCandidates = [
        data === null || data === void 0 ? void 0 : data.thumbnailUrl,
        data === null || data === void 0 ? void 0 : data.thumbnail,
        data === null || data === void 0 ? void 0 : data.thumbUrl,
        data === null || data === void 0 ? void 0 : data.heroImageUrl,
        data === null || data === void 0 ? void 0 : data.imageUrl,
        data === null || data === void 0 ? void 0 : data.photoUrl,
        data === null || data === void 0 ? void 0 : data.coverUrl,
        data === null || data === void 0 ? void 0 : data.coverImageUrl,
    ];
    for (const c of thumbCandidates) {
        const u = toUrlFromUnknown(c);
        if (u)
            urls.unshift(u);
    }
    // heroImage 객체
    const hero = data === null || data === void 0 ? void 0 : data.heroImage;
    const heroU = toUrlFromUnknown(hero);
    if (heroU)
        urls.unshift(heroU);
    // location.photo 등(혹시 있을 수 있음)
    const locPhoto = toUrlFromUnknown((_b = (_a = data === null || data === void 0 ? void 0 : data.location) === null || _a === void 0 ? void 0 : _a.photoUrl) !== null && _b !== void 0 ? _b : (_c = data === null || data === void 0 ? void 0 : data.location) === null || _c === void 0 ? void 0 : _c.imageUrl);
    if (locPhoto)
        urls.unshift(locPhoto);
    return uniqStrings(urls);
}
function normalizeLocationIdFromDoc(data) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const v = String((_h = (_f = (_d = (_b = (_a = data === null || data === void 0 ? void 0 : data.locationId) !== null && _a !== void 0 ? _a : data === null || data === void 0 ? void 0 : data.region) !== null && _b !== void 0 ? _b : (_c = data === null || data === void 0 ? void 0 : data.location) === null || _c === void 0 ? void 0 : _c.locationId) !== null && _d !== void 0 ? _d : (_e = data === null || data === void 0 ? void 0 : data.location) === null || _e === void 0 ? void 0 : _e.region) !== null && _f !== void 0 ? _f : (_g = data === null || data === void 0 ? void 0 : data.location) === null || _g === void 0 ? void 0 : _g.id) !== null && _h !== void 0 ? _h : "").trim();
    return v;
}
/**
 * category alias(레거시 코드) 대응: "필터 입력"에도, "응답 노출"에도 도움
 * - 여기 테이블은 최소한만 넣고, 나중에 데이터가 쌓이면 확장하면 됨.
 * - 현재 너는 "관광지"만 운영 중이라면 이걸로 충분.
 */
const CATEGORY_ALIASES = {
    "관광지": ["관광지", "tour", "tourism", "attraction", "sightseeing", "place"],
    "맛집": ["맛집", "restaurant", "food", "eatery"],
    "카페": ["카페", "cafe", "coffee"],
    "호텔": ["호텔", "hotel", "resort"],
    "마사지": ["마사지", "massage", "spa"],
    "바/클럽": ["바", "클럽", "bar", "club", "nightclub"],
};
function expandCategoryFilterValues(input) {
    const raw = String(input || "").trim();
    if (!raw || raw === "ALL")
        return ["ALL"];
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
function pickCanonicalCategory(input) {
    const raw = String(input || "").trim();
    if (!raw)
        return raw;
    for (const key of Object.keys(CATEGORY_ALIASES)) {
        const list = CATEGORY_ALIASES[key];
        if (list.some((x) => String(x).toLowerCase() === raw.toLowerCase()))
            return key;
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
const BUDGET_UNIT_ALIASES = {
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
function normalizeBudgetUnit(input) {
    const raw = String(input !== null && input !== void 0 ? input : "").trim();
    if (!raw)
        return null;
    const lower = raw.toLowerCase();
    // canonical direct
    if (ALLOWED_BUDGET_UNITS.has(lower))
        return lower;
    // alias match
    for (const [canon, aliases] of Object.entries(BUDGET_UNIT_ALIASES)) {
        if (aliases.some((a) => String(a).toLowerCase() === lower))
            return canon;
    }
    return null;
}
function normalizeBudget(input) {
    if (input == null || input === "")
        return null;
    // number
    if (typeof input === "number") {
        if (!Number.isFinite(input))
            return null;
        if (input < 0)
            return null;
        // 상한은 비정상 값 방지용(운영 안전)
        return Math.min(1000000000, input);
    }
    const s = String(input).trim();
    if (!s)
        return null;
    // remove common separators ("," or "₫" etc.)
    const cleaned = s.replace(/[₫,\s]/g, "");
    const n = Number(cleaned);
    if (!Number.isFinite(n))
        return null;
    if (n < 0)
        return null;
    return Math.min(1000000000, n);
}
function normalizeBudgetText(input) {
    const s = String(input !== null && input !== void 0 ? input : "").trim();
    if (!s)
        return null;
    // 너무 긴 텍스트는 운영/노출 CS 이슈(레이아웃 깨짐) -> 안전 상한
    return s.slice(0, 120);
}
function normalizePriceLevel(input) {
    if (input == null || input === "")
        return null;
    const n = Number(input);
    if (!Number.isFinite(n))
        return null;
    const v = Math.trunc(n);
    return Math.min(4, Math.max(0, v));
}
function hasOwn(obj, key) {
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
function normalizeSpotForAdminList(item, defaultMode) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const data = item || {};
    const mode = data.mode === "nightlife" || defaultMode === "nightlife" ? "nightlife" : "explorer";
    const imageUrls = extractImageUrls(data);
    const thumbnailUrl = String(data.thumbnailUrl || "").trim() || ((_a = imageUrls[0]) !== null && _a !== void 0 ? _a : null);
    const locationId = normalizeLocationIdFromDoc(data);
    const region = String(data.region || "").trim() || locationId;
    const categoryRaw = String((_b = data.category) !== null && _b !== void 0 ? _b : "").trim();
    const category = categoryRaw ? pickCanonicalCategory(categoryRaw) : categoryRaw;
    // ✅ 가격/예산 필드 표준화(운영 안정)
    const priceLevel = normalizePriceLevel((_e = (_d = (_c = data.priceLevel) !== null && _c !== void 0 ? _c : data.price_level) !== null && _d !== void 0 ? _d : data.priceTier) !== null && _e !== void 0 ? _e : data.price_tier);
    const budget = normalizeBudget((_g = (_f = data.budget) !== null && _f !== void 0 ? _f : data.budgetVnd) !== null && _g !== void 0 ? _g : data.budget_vnd);
    const budgetUnit = normalizeBudgetUnit((_h = data.budgetUnit) !== null && _h !== void 0 ? _h : data.budget_unit);
    const budgetText = normalizeBudgetText((_j = data.budgetText) !== null && _j !== void 0 ? _j : data.budget_text);
    return Object.assign(Object.assign({}, data), { mode,
        // ✅ 표준 이미지 필드
        imageUrls, images: imageUrls, thumbnailUrl, 
        // ✅ 표준 지역 필드(양쪽 다 채워서 프론트가 덜 헷갈리게)
        locationId: locationId || null, region: region || null, 
        // ✅ 표준 카테고리
        category, categoryRaw: categoryRaw || null, 
        // ✅ 신규 표준 필드(프론트/운영 공통)
        priceLevel,
        budget,
        budgetUnit,
        budgetText });
}
function clampInt(n, min, max, fallback) {
    const v = Number.isFinite(Number(n)) ? Number(n) : fallback;
    return Math.min(max, Math.max(min, Math.trunc(v)));
}
function safeJsonParse(s) {
    try {
        return JSON.parse(s);
    }
    catch (_a) {
        return null;
    }
}
function parseSpotCursor(raw) {
    if (!raw)
        return null;
    const str = String(raw).trim();
    if (!str)
        return null;
    // 1) JSON 직접
    const obj = safeJsonParse(str);
    if (obj && typeof obj === "object") {
        // 최소 검증
        if (obj.mode === "all") {
            const sortField = obj.sortField === "createdAt" ? "createdAt" : "updatedAt";
            const cursors = obj.cursors && typeof obj.cursors === "object" ? obj.cursors : {};
            const cA = cursors.spots && cursors.spots.id ? { sortAt: Number(cursors.spots.sortAt || 0), id: String(cursors.spots.id) } : null;
            const cB = cursors.adult_spots && cursors.adult_spots.id ? { sortAt: Number(cursors.adult_spots.sortAt || 0), id: String(cursors.adult_spots.id) } : null;
            return { v: 1, mode: "all", sortField, cursors: { spots: cA, adult_spots: cB } };
        }
        if (obj.mode === "explorer" || obj.mode === "nightlife") {
            const sortField = obj.sortField === "createdAt" ? "createdAt" : "updatedAt";
            const sortAt = Number(obj.sortAt || 0);
            const id = String(obj.id || "").trim();
            if (!id || !Number.isFinite(sortAt))
                return null;
            return { v: 1, mode: obj.mode, sortField, sortAt, id };
        }
    }
    // 2) 그냥 문자열이면 (레거시/외부) -> 무시
    return null;
}
function encodeSpotCursorSingle(mode, sortField, sortAt, id) {
    const payload = { v: 1, mode, sortField, sortAt, id };
    return JSON.stringify(payload);
}
function encodeSpotCursorAll(sortField, cursors) {
    const payload = { v: 1, mode: "all", sortField, cursors };
    return JSON.stringify(payload);
}
function sortKeyFromDoc(data, sortField) {
    var _a;
    const m = (0, shared_1.toMillis)(data === null || data === void 0 ? void 0 : data[sortField]);
    if (m != null)
        return m;
    // fallback tie-breaker: createdAt/updatedAt 모두 없을 때 0
    const alt = (_a = (0, shared_1.toMillis)(data === null || data === void 0 ? void 0 : data.updatedAt)) !== null && _a !== void 0 ? _a : (0, shared_1.toMillis)(data === null || data === void 0 ? void 0 : data.createdAt);
    return alt !== null && alt !== void 0 ? alt : 0;
}
function compareBySortDesc(a, b) {
    if (b.sortAt !== a.sortAt)
        return b.sortAt - a.sortAt;
    // id desc (documentId를 desc로 두는 것과 동일한 방향)
    if (b.id === a.id)
        return 0;
    return b.id > a.id ? 1 : -1;
}
async function fetchSpotsPageFromCollection(params) {
    const { colName, defaultMode, sortField, region, category, limit, cursor } = params;
    const per = Math.max(1, Math.min(200, limit));
    const take = per + 1;
    const categoryValues = category === "ALL" ? ["ALL"] : expandCategoryFilterValues(category);
    const useCategoryMulti = categoryValues.length > 1;
    const applyMemoryFilters = (list) => {
        let out = list;
        // region: locationId/region 혼재 대응
        if (region !== "ALL") {
            out = out.filter((s) => {
                const v = String(s.locationId || s.region || "");
                return v === region;
            });
        }
        // category: alias 대응(레거시)
        if (category !== "ALL") {
            const allowed = new Set(categoryValues.map((x) => String(x)));
            out = out.filter((s) => allowed.has(String(s.category || "")));
        }
        return out;
    };
    const pack = (docs) => docs.map((d) => {
        var _a, _b;
        const data = d.data() || {};
        const mode = data.mode === "nightlife" || colName === "adult_spots" ? "nightlife" : "explorer";
        const _sortAt = sortKeyFromDoc(data, sortField);
        // ✅ list 응답에 필요한 표준 필드 강제 주입
        const normalized = normalizeSpotForAdminList(Object.assign(Object.assign({ id: d.id }, data), { mode: (_a = data.mode) !== null && _a !== void 0 ? _a : mode }), defaultMode);
        return Object.assign(Object.assign({}, normalized), { id: d.id, mode: (_b = normalized.mode) !== null && _b !== void 0 ? _b : mode, _sortAt });
    });
    // 1) 정석: Firestore cursor query (대량 데이터 대응)
    try {
        const baseCol = shared_1.db.collection(colName);
        const regionFields = region !== "ALL" ? ["locationId", "region"] : ["locationId"];
        // category alias가 여러 개인 경우, query를 몇 개만 수행하고 나머지는 메모리에서 보정(너무 많은 쿼리 방지)
        const categoryQueryValues = category === "ALL" ? [null] : categoryValues.slice(0, 2).map((v) => (v === "ALL" ? null : v));
        const specs = [];
        for (const rf of regionFields) {
            for (const cv of categoryQueryValues) {
                specs.push({ regionField: rf, categoryValue: cv });
            }
        }
        // 쿼리 최대 4개(2 region fields x 2 category values)
        const buildQuery = (spec) => {
            let q = baseCol;
            if (region !== "ALL")
                q = q.where(spec.regionField, "==", region);
            if (spec.categoryValue)
                q = q.where("category", "==", spec.categoryValue);
            q = q.orderBy(sortField, "desc").orderBy(admin.firestore.FieldPath.documentId(), "desc");
            if ((cursor === null || cursor === void 0 ? void 0 : cursor.id) && Number.isFinite(cursor.sortAt)) {
                const ts = admin.firestore.Timestamp.fromMillis(Number(cursor.sortAt));
                q = q.startAfter(ts, cursor.id);
            }
            return q.limit(take);
        };
        const snaps = await Promise.all(specs.map((s) => buildQuery(s).get()));
        // merge & dedup
        const mergedDocs = [];
        const seen = new Set();
        for (const snap of snaps) {
            for (const d of snap.docs) {
                if (seen.has(d.id))
                    continue;
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
    }
    catch (e) {
        // 2) fallback: 인덱스/필드 불일치 시에도 화면이 죽지 않게 "최근 N개 스캔 후 메모리 필터/정렬/커서" (정확도 제한)
        console.warn(`[admin/spots] query failed on ${colName} (${sortField}). fallback scan.`, e);
    }
    // fallback scan window (운영에서 너무 크게 잡지 않음)
    const scanMax = Math.min(2000, Math.max(400, per * 12));
    const recentSnap = await (0, shared_1.readRecent)(colName, scanMax);
    let list = pack(recentSnap.docs);
    // 메모리 필터
    list = applyMemoryFilters(list);
    // 정렬
    list.sort((a, b) => compareBySortDesc({ sortAt: a._sortAt, id: a.id }, { sortAt: b._sortAt, id: b.id }));
    // cursor 적용(메모리)
    let startIdx = 0;
    if ((cursor === null || cursor === void 0 ? void 0 : cursor.id) && Number.isFinite(cursor.sortAt)) {
        const idx = list.findIndex((x) => x.id === cursor.id && x._sortAt === Number(cursor.sortAt));
        if (idx >= 0)
            startIdx = idx + 1;
        else {
            // 커서를 못 찾으면 "커서보다 뒤(older)"로 추정 이동
            startIdx = list.findIndex((x) => compareBySortDesc({ sortAt: Number(cursor.sortAt), id: cursor.id }, { sortAt: x._sortAt, id: x.id }) < 0);
            if (startIdx < 0)
                startIdx = 0;
        }
    }
    const window = list.slice(startIdx, startIdx + per + 1);
    const hasNext = window.length > per;
    const pageItems = hasNext ? window.slice(0, per) : window;
    const last = pageItems.length ? pageItems[pageItems.length - 1] : null;
    const nextCursor = last ? { sortAt: last._sortAt, id: last.id } : null;
    return { items: pageItems, hasNext, nextCursor, approximate: true };
}
//# sourceMappingURL=spots.shared.js.map