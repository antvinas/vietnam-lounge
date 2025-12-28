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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
// firebase/functions/src/api/admin/spots.router.ts
const express = __importStar(require("express"));
const admin = __importStar(require("firebase-admin"));
const zod_1 = require("zod");
const validate_1 = require("../../middlewares/validate");
const shared_1 = require("./shared");
const spots_shared_1 = require("./spots.shared");
const router = express.Router();
// (Spots)
// ==========================================
//
// ✅ cursor 기반:
//   GET /admin/spots?mode=explorer|nightlife|all&region=ALL|<locationId>&category=ALL|<category>&limit=50&cursor=<json>
//
// 응답(권장):
//   { items, limit, hasNext, nextCursor }
//
// 레거시 호환(기존 page 기반도 동작):
//   GET /admin/spots?...&page=1&limit=50
//   { items, page, limit, hasNext, nextCursor }
//
// nextCursor 포맷:
//   - mode=explorer|nightlife: {"v":1,"mode":"explorer","sortField":"updatedAt","sortAt":<millis>,"id":"<docId>"}
//   - mode=all: {"v":1,"mode":"all","sortField":"updatedAt","cursors":{"spots":{...},"adult_spots":{...}}}
//
router.get("/", async (req, res) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    try {
        const modeRaw = String(req.query.mode || "explorer").trim().toLowerCase();
        const mode = (modeRaw === "nightlife" ? "nightlife" : modeRaw === "all" ? "all" : "explorer");
        const region = String(req.query.region || "ALL");
        const category = String(req.query.category || "ALL");
        // ✅ 운영 기준: 기본/최소 20, 20/50/100/200 위주로 쓰는 전제
        const limit = (0, spots_shared_1.clampInt)(req.query.limit, 20, 200, 20);
        // ✅ cursor 우선, 없으면 page(레거시)
        const cursor = (0, spots_shared_1.parseSpotCursor)(req.query.cursor);
        const page = (0, spots_shared_1.clampInt)(req.query.page, 1, 9999, 1);
        // 정렬 필드는 커서에 맞춰 고정(혼용 방지)
        const sortField = cursor && cursor.mode !== "all"
            ? cursor.sortField
            : cursor && cursor.mode === "all"
                ? cursor.sortField
                : "updatedAt";
        // --------------------------------------------
        // 1) cursor 기반 (권장)
        // --------------------------------------------
        if (cursor) {
            // mode mismatch 방지: 요청 mode가 all인데 cursor가 single이면, 또는 반대면 요청 mode를 cursor 기준으로 해석
            if (cursor.mode === "all") {
                // all 모드: 두 컬렉션을 "각각 limit+1" 받아서 merge 후 상위 limit 반환
                const cSpots = (_b = (_a = cursor.cursors) === null || _a === void 0 ? void 0 : _a.spots) !== null && _b !== void 0 ? _b : null;
                const cAdult = (_d = (_c = cursor.cursors) === null || _c === void 0 ? void 0 : _c.adult_spots) !== null && _d !== void 0 ? _d : null;
                const [a, b] = await Promise.all([
                    (0, spots_shared_1.fetchSpotsPageFromCollection)({
                        colName: "spots",
                        defaultMode: "explorer",
                        sortField,
                        region,
                        category,
                        limit,
                        cursor: cSpots,
                    }),
                    (0, spots_shared_1.fetchSpotsPageFromCollection)({
                        colName: "adult_spots",
                        defaultMode: "nightlife",
                        sortField,
                        region,
                        category,
                        limit,
                        cursor: cAdult,
                    }),
                ]);
                let merged = [
                    ...a.items.map((x) => (Object.assign(Object.assign({}, x), { _src: "spots" }))),
                    ...b.items.map((x) => (Object.assign(Object.assign({}, x), { _src: "adult_spots" }))),
                ];
                // 최신순 merge (sortAt desc, id desc)
                merged.sort((x, y) => (0, spots_shared_1.compareBySortDesc)({ sortAt: x._sortAt, id: x.id }, { sortAt: y._sortAt, id: y.id }));
                // mode=all 일 때, 기존 로직과 동일하게 "id 중복" 제거
                const seen = new Set();
                merged = merged.filter((d) => {
                    if (!(d === null || d === void 0 ? void 0 : d.id))
                        return false;
                    if (seen.has(d.id))
                        return false;
                    seen.add(d.id);
                    return true;
                });
                const pagePlusOne = merged.slice(0, limit + 1);
                const hasNext = pagePlusOne.length > limit;
                const pageItems = hasNext ? pagePlusOne.slice(0, limit) : pagePlusOne;
                // 컬렉션별로 "이번 페이지에서 소비한(prefix) 마지막 문서"를 커서로
                const lastBySrc = {
                    spots: null,
                    adult_spots: null,
                };
                for (const item of pageItems) {
                    if (item._src === "spots")
                        lastBySrc.spots = { sortAt: item._sortAt, id: item.id };
                    if (item._src === "adult_spots")
                        lastBySrc.adult_spots = { sortAt: item._sortAt, id: item.id };
                }
                const nextCursors = {
                    spots: (_f = (_e = lastBySrc.spots) !== null && _e !== void 0 ? _e : cSpots) !== null && _f !== void 0 ? _f : null,
                    adult_spots: (_h = (_g = lastBySrc.adult_spots) !== null && _g !== void 0 ? _g : cAdult) !== null && _h !== void 0 ? _h : null,
                };
                const nextCursor = hasNext ? (0, spots_shared_1.encodeSpotCursorAll)(sortField, nextCursors) : null;
                const outItems = pageItems
                    .map((_a) => {
                    var { _sortAt, _src } = _a, rest = __rest(_a, ["_sortAt", "_src"]);
                    return rest;
                })
                    .map((x) => (0, spots_shared_1.normalizeSpotForAdminList)(x, x.mode === "nightlife" ? "nightlife" : "explorer"));
                return res.status(200).send({
                    items: outItems,
                    limit,
                    hasNext,
                    nextCursor,
                    approximate: Boolean(a.approximate || b.approximate),
                });
            }
            // single mode cursor
            const singleMode = cursor.mode;
            const colName = (0, shared_1.collectionForMode)(singleMode, "spots");
            const defaultMode = singleMode;
            const r = await (0, spots_shared_1.fetchSpotsPageFromCollection)({
                colName,
                defaultMode,
                sortField: cursor.sortField,
                region,
                category,
                limit,
                cursor: { sortAt: cursor.sortAt, id: cursor.id },
            });
            const nextCursor = r.hasNext && r.nextCursor ? (0, spots_shared_1.encodeSpotCursorSingle)(singleMode, cursor.sortField, r.nextCursor.sortAt, r.nextCursor.id) : null;
            const items = r.items
                .map((_a) => {
                var { _sortAt } = _a, rest = __rest(_a, ["_sortAt"]);
                return rest;
            })
                .map((x) => (0, spots_shared_1.normalizeSpotForAdminList)(x, singleMode));
            return res.status(200).send({
                items,
                limit,
                hasNext: r.hasNext,
                nextCursor,
                approximate: Boolean(r.approximate),
            });
        }
        // --------------------------------------------
        // 2) 레거시: page 기반 (하위호환)
        //   - 내부적으로는 cursor 구현과 "비슷한 결과"를 주되,
        //     큰 데이터에서는 page/offset이 비효율적이므로 UI를 cursor로 전환 권장
        // --------------------------------------------
        const offset = (page - 1) * limit;
        // 레거시에서는 기존 동작처럼 mode=all도 허용 (커서 없으니 scan 기반으로 처리)
        const scanCap = 1500; // 레거시 안전 상한
        const scanSize = Math.min(scanCap, Math.max(300, offset + limit + 1));
        const colNames = mode === "all"
            ? [
                { col: "spots", mode: "explorer" },
                { col: "adult_spots", mode: "nightlife" },
            ]
            : [
                {
                    col: (0, shared_1.collectionForMode)(mode, "spots"),
                    mode: mode,
                },
            ];
        const readCol = async (colName) => {
            // 정렬은 updatedAt 우선, 없으면 createdAt, 그래도 안되면 그냥 limit
            try {
                return await shared_1.db.collection(colName).orderBy("updatedAt", "desc").limit(scanSize).get();
            }
            catch (_a) {
                try {
                    return await shared_1.db.collection(colName).orderBy("createdAt", "desc").limit(scanSize).get();
                }
                catch (_b) {
                    return await shared_1.db.collection(colName).limit(scanSize).get();
                }
            }
        };
        const rawSnaps = await Promise.all(colNames.map((c) => readCol(c.col)));
        // merge + mode 주입(프론트에서 관리에 필요)
        let docs = [];
        for (let i = 0; i < colNames.length; i++) {
            const c = colNames[i];
            const snap = rawSnaps[i];
            docs.push(...snap.docs.map((d) => {
                var _a;
                const data = d.data() || {};
                return (0, spots_shared_1.normalizeSpotForAdminList)(Object.assign(Object.assign({ id: d.id }, data), { mode: (_a = data.mode) !== null && _a !== void 0 ? _a : c.mode }), c.mode);
            }));
        }
        // region/locationId 혼재 대응
        if (region !== "ALL") {
            docs = docs.filter((s) => String(s.locationId || s.region || "") === region);
        }
        // category alias 대응(레거시)
        if (category !== "ALL") {
            const allowed = new Set((0, spots_shared_1.expandCategoryFilterValues)(category));
            docs = docs.filter((s) => allowed.has(String(s.category || "")) || allowed.has(String(s.categoryRaw || "")));
        }
        // 안전 정렬(쿼리 정렬이 없었을 수도 있으니 서버에서 확정)
        docs.sort((a, b) => {
            var _a, _b, _c, _d;
            const ta = (_b = (_a = (0, shared_1.toMillis)(a.updatedAt)) !== null && _a !== void 0 ? _a : (0, shared_1.toMillis)(a.createdAt)) !== null && _b !== void 0 ? _b : 0;
            const tb = (_d = (_c = (0, shared_1.toMillis)(b.updatedAt)) !== null && _c !== void 0 ? _c : (0, shared_1.toMillis)(b.createdAt)) !== null && _d !== void 0 ? _d : 0;
            return tb - ta;
        });
        // mode=all일 때 중복 id 방지(혹시 동일 id가 양쪽에 있을 경우)
        if (mode === "all") {
            const seen = new Set();
            docs = docs.filter((d) => {
                if (!(d === null || d === void 0 ? void 0 : d.id))
                    return false;
                if (seen.has(d.id))
                    return false;
                seen.add(d.id);
                return true;
            });
        }
        const items = docs.slice(offset, offset + limit);
        const hasNext = docs.length > offset + limit;
        // 레거시에서도 nextCursor를 제공해서 프론트 전환을 쉽게 함(옵션)
        const last = items.length ? items[items.length - 1] : null;
        const lastSortAt = last ? ((_k = (_j = (0, shared_1.toMillis)(last.updatedAt)) !== null && _j !== void 0 ? _j : (0, shared_1.toMillis)(last.createdAt)) !== null && _k !== void 0 ? _k : 0) : 0;
        // ⚠️ 레거시는 mode=all이면 single cursor가 정확하지 않을 수 있으니 null로 두는 게 안전
        const nextCursor = hasNext && last && mode !== "all"
            ? (0, spots_shared_1.encodeSpotCursorSingle)(mode === "nightlife" ? "nightlife" : "explorer", "updatedAt", lastSortAt, String(last.id))
            : null;
        return res.status(200).send({ items, page, limit, hasNext, nextCursor });
    }
    catch (e) {
        console.error(e);
        return res.status(500).send({ error: "Failed to fetch spots" });
    }
});
router.get("/:id", async (req, res) => {
    var _a;
    try {
        const { id } = req.params;
        const modeHint = (req.query.mode ? String(req.query.mode) : "");
        const tryCols = modeHint
            ? [{ col: (0, shared_1.collectionForMode)(modeHint, "spots"), mode: modeHint }]
            : [
                { col: "spots", mode: "explorer" },
                { col: "adult_spots", mode: "nightlife" },
            ];
        for (const c of tryCols) {
            const docSnap = await shared_1.db.collection(c.col).doc(id).get();
            if (docSnap.exists) {
                const data = docSnap.data() || {};
                // 상세에서도 표준 필드가 있으면 도움 되긴 해서 normalize 적용(파괴적 변경은 피하고, 추가만)
                const normalized = (0, spots_shared_1.normalizeSpotForAdminList)(Object.assign(Object.assign({ id: docSnap.id }, data), { mode: (_a = data.mode) !== null && _a !== void 0 ? _a : c.mode }), c.mode);
                return res.status(200).send(normalized);
            }
        }
        return res.status(404).send({ error: "Spot not found" });
    }
    catch (e) {
        console.error(e);
        return res.status(500).send({ error: "Failed to fetch spot" });
    }
});
const SpotUpsertSchema = zod_1.z
    .object({
    mode: zod_1.z.enum(["explorer", "nightlife"]),
    name: zod_1.z.string().min(1),
})
    .passthrough();
router.post("/", (0, validate_1.validate)(SpotUpsertSchema), async (req, res) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    try {
        const body = req.body;
        const mode = body.mode;
        const col = shared_1.db.collection((0, shared_1.collectionForMode)(mode, "spots"));
        const now = admin.firestore.FieldValue.serverTimestamp();
        const images = Array.isArray(body.images) ? body.images : Array.isArray(body.imageUrls) ? body.imageUrls : [];
        const imageUrls = (0, spots_shared_1.extractImageUrls)(Object.assign(Object.assign({}, body), { images, imageUrls: images }));
        const locationId = String((_b = (_a = body.locationId) !== null && _a !== void 0 ? _a : body.region) !== null && _b !== void 0 ? _b : "").trim();
        const region = String((_d = (_c = body.region) !== null && _c !== void 0 ? _c : body.locationId) !== null && _d !== void 0 ? _d : "").trim() || locationId;
        const category = String((_e = body.category) !== null && _e !== void 0 ? _e : "").trim();
        // ✅ 예산/가격대 필드 표준화 (운영 안정)
        const priceLevel = (0, spots_shared_1.normalizePriceLevel)((_h = (_g = (_f = body.priceLevel) !== null && _f !== void 0 ? _f : body.price_level) !== null && _g !== void 0 ? _g : body.priceTier) !== null && _h !== void 0 ? _h : body.price_tier);
        const budget = (0, spots_shared_1.normalizeBudget)((_k = (_j = body.budget) !== null && _j !== void 0 ? _j : body.budgetVnd) !== null && _k !== void 0 ? _k : body.budget_vnd);
        const budgetUnit = (0, spots_shared_1.normalizeBudgetUnit)((_l = body.budgetUnit) !== null && _l !== void 0 ? _l : body.budget_unit);
        const budgetText = (0, spots_shared_1.normalizeBudgetText)((_m = body.budgetText) !== null && _m !== void 0 ? _m : body.budget_text);
        const data = Object.assign(Object.assign({}, body), { images: imageUrls, imageUrls, thumbnailUrl: (_o = body.thumbnailUrl) !== null && _o !== void 0 ? _o : ((_p = imageUrls[0]) !== null && _p !== void 0 ? _p : null), 
            // ✅ region/locationId 단일화
            region,
            locationId,
            // ✅ 예산/가격대(표시/필터)
            priceLevel,
            budget,
            budgetUnit,
            budgetText, 
            // ✅ 검색 토큰: region/locationId/category 포함
            searchTokens: (0, shared_1.buildSearchTokens)([
                body.name,
                category,
                body.address,
                body.city,
                region,
                locationId,
                budgetText,
                budgetUnit,
                priceLevel != null ? String(priceLevel) : null,
            ]), createdAt: now, updatedAt: now });
        const ref = await col.add(data);
        await (0, shared_1.writeAuditLog)(req, "spots.create", { id: ref.id, mode });
        return res.status(200).send({ id: ref.id });
    }
    catch (e) {
        console.error(e);
        return res.status(500).send({ error: "Failed to create spot" });
    }
});
router.put("/:id", async (req, res) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    try {
        const { id } = req.params;
        const body = req.body;
        const mode = body.mode || "explorer";
        const colName = (0, shared_1.collectionForMode)(mode, "spots");
        const ref = shared_1.db.collection(colName).doc(id);
        const now = admin.firestore.FieldValue.serverTimestamp();
        const images = Array.isArray(body.images) ? body.images : Array.isArray(body.imageUrls) ? body.imageUrls : undefined;
        const patch = Object.assign(Object.assign({}, body), { updatedAt: now });
        // ✅ 예산/가격대 필드 정규화(운영 안정)
        if ((0, spots_shared_1.hasOwn)(body, "priceLevel") || (0, spots_shared_1.hasOwn)(body, "price_level") || (0, spots_shared_1.hasOwn)(body, "priceTier") || (0, spots_shared_1.hasOwn)(body, "price_tier")) {
            patch.priceLevel = (0, spots_shared_1.normalizePriceLevel)((_c = (_b = (_a = body.priceLevel) !== null && _a !== void 0 ? _a : body.price_level) !== null && _b !== void 0 ? _b : body.priceTier) !== null && _c !== void 0 ? _c : body.price_tier);
        }
        if ((0, spots_shared_1.hasOwn)(body, "budget") || (0, spots_shared_1.hasOwn)(body, "budgetVnd") || (0, spots_shared_1.hasOwn)(body, "budget_vnd")) {
            patch.budget = (0, spots_shared_1.normalizeBudget)((_e = (_d = body.budget) !== null && _d !== void 0 ? _d : body.budgetVnd) !== null && _e !== void 0 ? _e : body.budget_vnd);
        }
        if ((0, spots_shared_1.hasOwn)(body, "budgetUnit") || (0, spots_shared_1.hasOwn)(body, "budget_unit")) {
            patch.budgetUnit = (0, spots_shared_1.normalizeBudgetUnit)((_f = body.budgetUnit) !== null && _f !== void 0 ? _f : body.budget_unit);
        }
        if ((0, spots_shared_1.hasOwn)(body, "budgetText") || (0, spots_shared_1.hasOwn)(body, "budget_text")) {
            patch.budgetText = (0, spots_shared_1.normalizeBudgetText)((_g = body.budgetText) !== null && _g !== void 0 ? _g : body.budget_text);
        }
        if (images) {
            const imageUrls = (0, spots_shared_1.extractImageUrls)(Object.assign(Object.assign({}, body), { images, imageUrls: images }));
            patch.images = imageUrls;
            patch.imageUrls = imageUrls;
            if (!patch.thumbnailUrl)
                patch.thumbnailUrl = (_h = imageUrls[0]) !== null && _h !== void 0 ? _h : null;
        }
        else {
            // images가 없더라도, body에 대표 이미지가 들어오면 thumbnailUrl만이라도 유지
            if (patch.thumbnailUrl && typeof patch.thumbnailUrl === "string") {
                patch.thumbnailUrl = patch.thumbnailUrl.trim() || null;
            }
        }
        if (body.region || body.locationId) {
            const locationId = String((_k = (_j = body.locationId) !== null && _j !== void 0 ? _j : body.region) !== null && _k !== void 0 ? _k : "").trim();
            const region = String((_m = (_l = body.region) !== null && _l !== void 0 ? _l : body.locationId) !== null && _m !== void 0 ? _m : "").trim() || locationId;
            patch.region = region;
            patch.locationId = locationId;
        }
        // ✅ 운영용 검색 토큰(점진 도입)
        patch.searchTokens = (0, shared_1.buildSearchTokens)([
            patch.name,
            patch.category,
            patch.address,
            patch.city,
            patch.region,
            patch.locationId,
            patch.budgetText,
            patch.budgetUnit,
            patch.priceLevel != null ? String(patch.priceLevel) : null,
        ]);
        await ref.set(patch, { merge: true });
        await (0, shared_1.writeAuditLog)(req, "spots.update", { id, mode });
        return res.status(200).send({ ok: true });
    }
    catch (e) {
        console.error(e);
        return res.status(500).send({ error: "Failed to update spot" });
    }
});
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const modeHint = (req.query.mode ? String(req.query.mode) : "");
        const tryCols = modeHint ? [(0, shared_1.collectionForMode)(modeHint, "spots")] : ["spots", "adult_spots"];
        let deleted = false;
        for (const col of tryCols) {
            const ref = shared_1.db.collection(col).doc(id);
            const snap = await ref.get();
            if (snap.exists) {
                await ref.delete();
                deleted = true;
                break;
            }
        }
        if (!deleted)
            return res.status(404).send({ error: "Spot not found" });
        await (0, shared_1.writeAuditLog)(req, "spots.delete", { id, modeHint: modeHint || null });
        return res.status(200).send({ ok: true });
    }
    catch (e) {
        console.error(e);
        return res.status(500).send({ error: "Failed to delete spot" });
    }
});
exports.default = router;
//# sourceMappingURL=spots.router.js.map