// back_src/src/api/admin/spots.router.ts
import * as express from "express";
import * as admin from "firebase-admin";
import { z } from "zod";
import { validate } from "../../middlewares/validate";
import { db, buildSearchTokens, collectionForMode, toMillis, writeAuditLog } from "./shared";
import {
  clampInt,
  parseSpotCursor,
  encodeSpotCursorAll,
  encodeSpotCursorSingle,
  compareBySortDesc,
  fetchSpotsPageFromCollection,
  normalizeSpotForAdminList,
  extractImageUrls,
  normalizePriceLevel,
  normalizeBudget,
  normalizeBudgetUnit,
  normalizeBudgetText,
  expandCategoryFilterValues,
  hasOwn,
  type SpotMode,
  type SortField,
} from "./spots.shared";

const router = express.Router();

// ---------------------------------------------
// Validation
// ---------------------------------------------
const SpotCreateSchema = z
  .object({
    mode: z.enum(["explorer", "nightlife"]),
    name: z.string().min(1),
  })
  .passthrough();

const SpotPatchSchema = z
  .object({
    mode: z.enum(["explorer", "nightlife"]).optional(),
    name: z.string().min(1).optional(),
  })
  .passthrough();

// ---------------------------------------------
// Helpers
// ---------------------------------------------
function parseBool(v: any): boolean {
  if (v == null) return false;
  const s = String(v).trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "y" || s === "on";
}

function isDeletedDoc(d: any): boolean {
  const ls = String(d?.lifecycleStatus || "").toLowerCase();
  const s = String(d?.status || "").toLowerCase();
  return ls === "deleted" || s === "deleted" || Boolean(d?.deletedAt) || Boolean(d?.deletedBy);
}

function getActor(req: express.Request) {
  const u: any = (req as any).user || null;
  const uid = u?.uid ? String(u.uid) : null;
  const email = u?.email ? String(u.email) : null;
  return { uid, email };
}

function pickSpotAuditFields(x: any) {
  return {
    mode: x.mode ?? undefined,

    name: x.name ?? undefined,
    category: x.category ?? undefined,

    region: x.region ?? undefined,
    locationId: x.locationId ?? undefined,

    address: x.address ?? undefined,
    city: x.city ?? undefined,

    latitude: x.latitude ?? x.location?.lat ?? undefined,
    longitude: x.longitude ?? x.location?.lng ?? undefined,

    openHours: x.openHours ?? undefined,
    description: x.description ?? undefined,

    thumbnailUrl: x.thumbnailUrl ?? undefined,
    imageUrls: Array.isArray(x.imageUrls) ? x.imageUrls : Array.isArray(x.images) ? x.images : undefined,

    priceLevel: x.priceLevel ?? undefined,
    budget: x.budget ?? undefined,
    budgetUnit: x.budgetUnit ?? undefined,
    budgetText: x.budgetText ?? undefined,

    isSponsored: typeof x.isSponsored === "boolean" ? x.isSponsored : undefined,
    sponsorLevel: x.sponsorLevel ?? undefined,
    sponsorExpiry: x.sponsorExpiry ?? undefined,

    // ✅ Soft delete
    status: x.status ?? undefined,
    lifecycleStatus: x.lifecycleStatus ?? undefined,
    deletedAt: x.deletedAt ?? undefined,
    deletedBy: x.deletedBy ?? undefined,
  };
}

function diffChangedFields(before: Record<string, any>, after: Record<string, any>) {
  const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
  const changed: string[] = [];
  for (const k of keys) {
    const b = (before as any)?.[k];
    const a = (after as any)?.[k];
    const bs = typeof b === "string" ? b : JSON.stringify(b);
    const as = typeof a === "string" ? a : JSON.stringify(a);
    if (bs !== as) changed.push(k);
  }
  return changed;
}

function sanitizeWriteBody(body: any) {
  const b = { ...(body || {}) };
  delete b.id;
  delete b.createdAt;
  delete b.updatedAt;
  delete b.movedAt;
  delete b.deletedAt;
  delete b.deletedBy;
  delete b.deletedByUid;
  delete b.deletedByEmail;
  delete b.searchTokens;

  // ✅ Soft delete 상태는 서버만 변경
  delete b.lifecycleStatus;

  // status는 spot 운영에서 쓰일 수도 있으니 유지하되 "deleted"는 서버만 허용
  if (String(b.status || "").toLowerCase() === "deleted") delete b.status;

  return b;
}

async function findSpotDocById(id: string, modeHint?: "explorer" | "nightlife") {
  const tries: Array<{ col: string; mode: "explorer" | "nightlife" }> = modeHint
    ? [{ col: collectionForMode(modeHint, "spots"), mode: modeHint }]
    : [
        { col: "spots", mode: "explorer" },
        { col: "adult_spots", mode: "nightlife" },
      ];

  for (const t of tries) {
    const ref = db.collection(t.col).doc(id);
    const snap = await ref.get();
    if (snap.exists) return { ref, snap, mode: t.mode, col: t.col };
  }
  return null;
}

type SpotCursorObj = { sortAt: number; id: string } | null;

async function fetchSpotsPageWithSoftFilter(args: {
  colName: string;
  defaultMode: "explorer" | "nightlife";
  sortField: SortField;
  region: string;
  category: string;
  limit: number;
  cursor: SpotCursorObj;
  includeDeleted: boolean;
  onlyDeleted: boolean;
}) {
  const { includeDeleted, onlyDeleted } = args;

  const predicate = (d: any) => {
    const del = isDeletedDoc(d);
    if (onlyDeleted) return del;
    if (includeDeleted) return true;
    return !del;
  };

  // includeDeleted=true 이면 기존 로직 그대로 써도 OK
  if (includeDeleted && !onlyDeleted) {
    const r = await fetchSpotsPageFromCollection({
      colName: args.colName,
      defaultMode: args.defaultMode,
      sortField: args.sortField,
      region: args.region,
      category: args.category,
      limit: args.limit,
      cursor: args.cursor,
    });

    return {
      items: r.items.filter(predicate),
      hasNext: r.hasNext,
      nextCursor: r.nextCursor as SpotCursorObj,
      approximate: Boolean(r.approximate),
    };
  }

  // ✅ deleted 제외/onlyDeleted인 경우: over-scan 해서 limit 채우기
  const MAX_ITERS = 12;
  const BATCH_LIMIT = Math.min(200, Math.max(args.limit * 3, 60));

  let out: any[] = [];
  let cur: SpotCursorObj = args.cursor;
  let approximate = false;
  let hasNext = false;
  let nextCursor: SpotCursorObj = null;

  for (let i = 0; i < MAX_ITERS; i++) {
    const r = await fetchSpotsPageFromCollection({
      colName: args.colName,
      defaultMode: args.defaultMode,
      sortField: args.sortField,
      region: args.region,
      category: args.category,
      limit: BATCH_LIMIT,
      cursor: cur,
    });

    approximate = approximate || Boolean(r.approximate);

    if (!r.items?.length) {
      hasNext = false;
      nextCursor = null;
      break;
    }

    // 현재 배치에서 predicate 만족하는 것만 누적
    for (let j = 0; j < r.items.length; j++) {
      const item = r.items[j];
      if (!predicate(item)) continue;

      if (out.length < args.limit) {
        out.push(item);
        nextCursor = { sortAt: item._sortAt, id: item.id };
      } else {
        // limit을 이미 채웠고 더 뒤에도 매칭이 있다는 뜻
        hasNext = true;
        break;
      }
    }

    if (out.length >= args.limit) {
      // 다음 페이지가 있을지: (1) 배치 내에 더 매칭이 있었거나 (2) 원본에 더 있음
      hasNext = hasNext || Boolean(r.hasNext);
      break;
    }

    // 더 채워야 하는데 원본이 끝이면 종료
    if (!r.hasNext || !r.nextCursor) {
      hasNext = false;
      nextCursor = out.length ? nextCursor : null;
      break;
    }

    // 다음 scan
    cur = r.nextCursor as SpotCursorObj;
  }

  // out이 비었는데도 deleted 때문에 못 찾았을 가능성 -> 그냥 빈 배열 반환(휴지통이면 0도 가능)
  return { items: out, hasNext, nextCursor, approximate };
}

// ---------------------------------------------
// Routes
// --------------------------------------------

/**
 * GET /admin/spots?...&includeDeleted=0|1&onlyDeleted=0|1
 */
router.get("/", async (req, res) => {
  try {
    const modeRaw = String(req.query.mode || "explorer").trim().toLowerCase();
    const mode = (modeRaw === "nightlife" ? "nightlife" : modeRaw === "all" ? "all" : "explorer") as SpotMode;

    const region = String(req.query.region || "ALL");
    const category = String(req.query.category || "ALL");

    const includeDeleted = parseBool(req.query.includeDeleted);
    const onlyDeleted = parseBool(req.query.onlyDeleted) || parseBool(req.query.trash);

    const limit = clampInt(req.query.limit, 20, 200, 20);

    const cursor = parseSpotCursor(req.query.cursor);
    const page = clampInt(req.query.page, 1, 9999, 1);

    const sortField: SortField =
      cursor && cursor.mode !== "all"
        ? cursor.sortField
        : cursor && cursor.mode === "all"
          ? cursor.sortField
          : "updatedAt";

    if (cursor) {
      if (cursor.mode === "all") {
        const cSpots = cursor.cursors?.spots ?? null;
        const cAdult = cursor.cursors?.adult_spots ?? null;

        // ✅ 각 컬렉션에서 soft-filter 적용
        const [a, b] = await Promise.all([
          fetchSpotsPageWithSoftFilter({
            colName: "spots",
            defaultMode: "explorer",
            sortField,
            region,
            category,
            limit: Math.min(200, limit * 2),
            cursor: cSpots,
            includeDeleted,
            onlyDeleted,
          }),
          fetchSpotsPageWithSoftFilter({
            colName: "adult_spots",
            defaultMode: "nightlife",
            sortField,
            region,
            category,
            limit: Math.min(200, limit * 2),
            cursor: cAdult,
            includeDeleted,
            onlyDeleted,
          }),
        ]);

        let merged = [
          ...a.items.map((x) => ({ ...x, _src: "spots" as const })),
          ...b.items.map((x) => ({ ...x, _src: "adult_spots" as const })),
        ];

        merged.sort((x, y) => compareBySortDesc({ sortAt: x._sortAt, id: x.id }, { sortAt: y._sortAt, id: y.id }));

        const seen = new Set<string>();
        merged = merged.filter((d) => {
          if (!d?.id) return false;
          if (seen.has(d.id)) return false;
          seen.add(d.id);
          return true;
        });

        const pagePlusOne = merged.slice(0, limit + 1);
        const hasNext = pagePlusOne.length > limit;
        const pageItems = hasNext ? pagePlusOne.slice(0, limit) : pagePlusOne;

        const lastBySrc: Record<"spots" | "adult_spots", { sortAt: number; id: string } | null> = {
          spots: null,
          adult_spots: null,
        };

        for (const item of pageItems as any[]) {
          if (item._src === "spots") lastBySrc.spots = { sortAt: item._sortAt, id: item.id };
          if (item._src === "adult_spots") lastBySrc.adult_spots = { sortAt: item._sortAt, id: item.id };
        }

        // ⚠️ stateless merge cursor의 한계 때문에, 해당 src에서 현재 페이지에 선택된 마지막 아이템 기준으로만 커서 전진
        const nextCursors = {
          spots: lastBySrc.spots ?? cSpots ?? null,
          adult_spots: lastBySrc.adult_spots ?? cAdult ?? null,
        };

        const nextCursor = hasNext ? encodeSpotCursorAll(sortField, nextCursors) : null;

        const outItems = (pageItems as any[])
          .map(({ _sortAt, _src, ...rest }) => rest)
          .map((x) => normalizeSpotForAdminList(x, (x.mode as any) === "nightlife" ? "nightlife" : "explorer"));

        return res.status(200).send({
          items: outItems,
          limit,
          hasNext,
          nextCursor,
          approximate: Boolean(a.approximate || b.approximate),
          includeDeleted,
          onlyDeleted,
        });
      }

      const singleMode = cursor.mode;
      const colName = collectionForMode(singleMode, "spots");
      const defaultMode: "explorer" | "nightlife" = singleMode;

      const r = await fetchSpotsPageWithSoftFilter({
        colName,
        defaultMode,
        sortField: cursor.sortField,
        region,
        category,
        limit,
        cursor: { sortAt: cursor.sortAt, id: cursor.id },
        includeDeleted,
        onlyDeleted,
      });

      const nextCursor =
        r.hasNext && r.nextCursor
          ? encodeSpotCursorSingle(singleMode, cursor.sortField, r.nextCursor.sortAt, r.nextCursor.id)
          : null;

      const items = r.items
        .map(({ _sortAt, ...rest }) => rest)
        .map((x) => normalizeSpotForAdminList(x, singleMode));

      return res.status(200).send({
        items,
        limit,
        hasNext: r.hasNext,
        nextCursor,
        approximate: Boolean(r.approximate),
        includeDeleted,
        onlyDeleted,
      });
    }

    // legacy page mode
    const offset = (page - 1) * limit;
    const scanCap = 1500;
    const scanSize = Math.min(scanCap, Math.max(300, offset + limit + 1));

    const colNames =
      mode === "all"
        ? ([
            { col: "spots", mode: "explorer" as const },
            { col: "adult_spots", mode: "nightlife" as const },
          ] as const)
        : ([
            {
              col: collectionForMode(mode as any, "spots"),
              mode: mode as "explorer" | "nightlife",
            },
          ] as const);

    const readCol = async (colName: string) => {
      try {
        return await db.collection(colName).orderBy("updatedAt", "desc").limit(scanSize).get();
      } catch {
        try {
          return await db.collection(colName).orderBy("createdAt", "desc").limit(scanSize).get();
        } catch {
          return await db.collection(colName).limit(scanSize).get();
        }
      }
    };

    const rawSnaps = await Promise.all(colNames.map((c) => readCol(c.col)));

    let docs: any[] = [];
    for (let i = 0; i < colNames.length; i++) {
      const c = colNames[i];
      const snap = rawSnaps[i];
      docs.push(
        ...snap.docs.map((d) => {
          const data: any = d.data() || {};
          return normalizeSpotForAdminList({ id: d.id, ...data, mode: data.mode ?? c.mode }, c.mode);
        })
      );
    }

    if (region !== "ALL") {
      docs = docs.filter((s: any) => String(s.locationId || s.region || "") === region);
    }

    if (category !== "ALL") {
      const allowed = new Set(expandCategoryFilterValues(category));
      docs = docs.filter((s: any) => allowed.has(String(s.category || "")) || allowed.has(String(s.categoryRaw || "")));
    }

    // ✅ Soft delete filter (legacy mode는 in-memory라 정확)
    docs = docs.filter((d: any) => {
      const del = isDeletedDoc(d);
      if (onlyDeleted) return del;
      if (includeDeleted) return true;
      return !del;
    });

    docs.sort((a: any, b: any) => {
      const ta = toMillis(a.updatedAt) ?? toMillis(a.createdAt) ?? 0;
      const tb = toMillis(b.updatedAt) ?? toMillis(b.createdAt) ?? 0;
      return tb - ta;
    });

    if (mode === "all") {
      const seen = new Set<string>();
      docs = docs.filter((d: any) => {
        if (!d?.id) return false;
        if (seen.has(d.id)) return false;
        seen.add(d.id);
        return true;
      });
    }

    const items = docs.slice(offset, offset + limit);
    const hasNext = docs.length > offset + limit;

    const last = items.length ? items[items.length - 1] : null;
    const lastSortAt = last ? (toMillis(last.updatedAt) ?? toMillis(last.createdAt) ?? 0) : 0;

    const nextCursor =
      hasNext && last && mode !== "all"
        ? encodeSpotCursorSingle(mode === "nightlife" ? "nightlife" : "explorer", "updatedAt", lastSortAt, String(last.id))
        : null;

    return res.status(200).send({ items, page, limit, hasNext, nextCursor, includeDeleted, onlyDeleted });
  } catch (e) {
    console.error(e);
    return res.status(500).send({ error: "Failed to fetch spots" });
  }
});

/**
 * GET /admin/spots/:id?includeDeleted=0|1
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const modeHint = (req.query.mode ? String(req.query.mode) : "") as "explorer" | "nightlife" | "";
    const includeDeleted = parseBool(req.query.includeDeleted);

    const found = await findSpotDocById(id, (modeHint as any) || undefined);
    const found2 = found ? found : await findSpotDocById(id, modeHint === "explorer" ? "nightlife" : "explorer");
    if (!found2) return res.status(404).send({ error: "Spot not found" });

    const data = found2.snap.data() || {};
    if (!includeDeleted && isDeletedDoc(data)) {
      return res.status(404).send({ error: "Spot not found" });
    }

    const normalized = normalizeSpotForAdminList(
      { id: found2.snap.id, ...data, mode: (data as any).mode ?? found2.mode },
      found2.mode
    );
    return res.status(200).send(normalized);
  } catch (e) {
    console.error(e);
    return res.status(500).send({ error: "Failed to fetch spot" });
  }
});

/**
 * POST /admin/spots
 */
router.post("/", validate(SpotCreateSchema, "body"), async (req, res) => {
  try {
    const bodyRaw = req.body as any;
    const body = sanitizeWriteBody(bodyRaw);

    const mode = body.mode as "explorer" | "nightlife";
    const col = db.collection(collectionForMode(mode, "spots"));

    const now = admin.firestore.FieldValue.serverTimestamp();

    const images = Array.isArray(body.images) ? body.images : Array.isArray(body.imageUrls) ? body.imageUrls : [];
    const imageUrls = extractImageUrls({ ...body, images, imageUrls: images });

    const locationId = String(body.locationId ?? body.region ?? "").trim();
    const region = String(body.region ?? body.locationId ?? "").trim() || locationId;

    const category = String(body.category ?? "").trim();

    const priceLevel = normalizePriceLevel(body.priceLevel ?? body.price_level ?? body.priceTier ?? body.price_tier);
    const budget = normalizeBudget(body.budget ?? body.budgetVnd ?? body.budget_vnd);
    const budgetUnit = normalizeBudgetUnit(body.budgetUnit ?? body.budget_unit);
    const budgetText = normalizeBudgetText(body.budgetText ?? body.budget_text);

    const status = body.status ? String(body.status) : "active";

    const data = {
      ...body,
      mode,

      // ✅ Soft delete defaults
      status: status.toLowerCase() === "deleted" ? "active" : status,
      lifecycleStatus: "active",

      images: imageUrls,
      imageUrls,
      thumbnailUrl: body.thumbnailUrl ?? (imageUrls[0] ?? null),

      region,
      locationId,

      priceLevel,
      budget,
      budgetUnit,
      budgetText,

      searchTokens: buildSearchTokens([
        body.name,
        category,
        body.address,
        body.city,
        region,
        locationId,
        budgetText,
        budgetUnit,
        priceLevel != null ? String(priceLevel) : null,
      ]),

      createdAt: now,
      updatedAt: now,
    };

    const ref = await col.add(data);

    const afterAudit = pickSpotAuditFields(data);
    await writeAuditLog(req, "spots.create", {
      targetType: "spot",
      targetId: ref.id,
      changedFields: Object.keys(afterAudit),
      before: null,
      after: afterAudit,
      id: ref.id,
      mode,
    });

    return res.status(200).send({ id: ref.id });
  } catch (e) {
    console.error(e);
    return res.status(500).send({ error: "Failed to create spot" });
  }
});

/**
 * PUT /admin/spots/:id
 * - 삭제된 문서는 수정 금지(복구 후 수정)
 * - mode mismatch 안전 처리 + mode 변경 시 move 지원 + 감사로그 강화
 */
router.put("/:id", validate(SpotPatchSchema, "body"), async (req, res) => {
  try {
    const { id } = req.params;
    const bodyRaw = req.body as any;
    const body = sanitizeWriteBody(bodyRaw);

    const requestedMode = (body.mode || req.query.mode || "explorer") as "explorer" | "nightlife";

    const found = await findSpotDocById(id, requestedMode);
    const found2 = found ? found : await findSpotDocById(id, requestedMode === "explorer" ? "nightlife" : "explorer");
    if (!found2) return res.status(404).send({ error: "Spot not found" });

    const before = found2.snap.data() || {};
    const beforeMode: "explorer" | "nightlife" = ((before as any).mode ?? found2.mode) as any;

    // ✅ 삭제된 항목은 수정 금지
    if (isDeletedDoc(before)) {
      return res.status(409).send({ error: "Spot is deleted. Restore first.", code: "resource/deleted" });
    }

    const now = admin.firestore.FieldValue.serverTimestamp();

    const patch: any = {
      ...body,
      updatedAt: now,
    };

    // 예산/가격대 정규화
    if (hasOwn(body, "priceLevel") || hasOwn(body, "price_level") || hasOwn(body, "priceTier") || hasOwn(body, "price_tier")) {
      patch.priceLevel = normalizePriceLevel(body.priceLevel ?? body.price_level ?? body.priceTier ?? body.price_tier);
    }
    if (hasOwn(body, "budget") || hasOwn(body, "budgetVnd") || hasOwn(body, "budget_vnd")) {
      patch.budget = normalizeBudget(body.budget ?? body.budgetVnd ?? body.budget_vnd);
    }
    if (hasOwn(body, "budgetUnit") || hasOwn(body, "budget_unit")) {
      patch.budgetUnit = normalizeBudgetUnit(body.budgetUnit ?? body.budget_unit);
    }
    if (hasOwn(body, "budgetText") || hasOwn(body, "budget_text")) {
      patch.budgetText = normalizeBudgetText(body.budgetText ?? body.budget_text);
    }

    // images 정규화
    const images = Array.isArray(body.images) ? body.images : Array.isArray(body.imageUrls) ? body.imageUrls : undefined;
    if (images) {
      const imageUrls = extractImageUrls({ ...body, images, imageUrls: images });
      patch.images = imageUrls;
      patch.imageUrls = imageUrls;
      if (!patch.thumbnailUrl) patch.thumbnailUrl = imageUrls[0] ?? null;
    } else if (patch.thumbnailUrl && typeof patch.thumbnailUrl === "string") {
      patch.thumbnailUrl = patch.thumbnailUrl.trim() || null;
    }

    // region/locationId 정규화
    if (body.region || body.locationId) {
      const locationId = String(body.locationId ?? body.region ?? "").trim();
      const region = String(body.region ?? body.locationId ?? "").trim() || locationId;
      patch.region = region;
      patch.locationId = locationId;
    }

    patch.searchTokens = buildSearchTokens([
      patch.name ?? (before as any).name,
      patch.category ?? (before as any).category,
      patch.address ?? (before as any).address,
      patch.city ?? (before as any).city,
      patch.region ?? (before as any).region,
      patch.locationId ?? (before as any).locationId,
      patch.budgetText ?? (before as any).budgetText,
      patch.budgetUnit ?? (before as any).budgetUnit,
      patch.priceLevel != null ? String(patch.priceLevel) : (before as any).priceLevel != null ? String((before as any).priceLevel) : null,
    ]);

    const toMode: "explorer" | "nightlife" = (body.mode || beforeMode) as any;

    // ✅ mode 변경이면 move(컬렉션 이동)
    if (toMode !== beforeMode) {
      const toColName = collectionForMode(toMode, "spots");
      const fromColName = collectionForMode(beforeMode, "spots");
      const fromRef = db.collection(fromColName).doc(id);
      const toRef = db.collection(toColName).doc(id);

      const batch = db.batch();
      batch.set(
        toRef,
        {
          ...before,
          ...patch,
          mode: toMode,
          movedAt: now,
        },
        { merge: true }
      );
      batch.delete(fromRef);
      await batch.commit();

      const beforeAudit = pickSpotAuditFields({ ...before, mode: beforeMode });
      const afterAudit = pickSpotAuditFields({ ...before, ...patch, mode: toMode });

      await writeAuditLog(req, "spots.update", {
        targetType: "spot",
        targetId: id,
        changedFields: diffChangedFields(beforeAudit, afterAudit),
        before: beforeAudit,
        after: afterAudit,
        id,
        mode: toMode,
        moved: true,
        fromMode: beforeMode,
        toMode,
      });

      return res.status(200).send({ ok: true, moved: true, fromMode: beforeMode, toMode });
    }

    // 일반 업데이트
    await found2.ref.set(patch, { merge: true });

    const beforeAudit = pickSpotAuditFields(before);
    const afterAudit = pickSpotAuditFields({ ...before, ...patch, mode: beforeMode });
    const changedFields = diffChangedFields(beforeAudit, afterAudit);

    await writeAuditLog(req, "spots.update", {
      targetType: "spot",
      targetId: id,
      changedFields,
      before: beforeAudit,
      after: afterAudit,
      id,
      mode: beforeMode,
    });

    return res.status(200).send({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).send({ error: "Failed to update spot" });
  }
});

/**
 * ✅ POST /admin/spots/:id/restore
 * - 휴지통 복구
 */
router.post("/:id/restore", async (req, res) => {
  try {
    const { id } = req.params;
    const modeHint = (req.query.mode ? String(req.query.mode) : "") as "explorer" | "nightlife" | "";

    const found = await findSpotDocById(id, (modeHint as any) || undefined);
    const found2 = found ? found : await findSpotDocById(id, modeHint === "explorer" ? "nightlife" : "explorer");
    if (!found2) return res.status(404).send({ error: "Spot not found" });

    const before = found2.snap.data() || {};
    const beforeMode: "explorer" | "nightlife" = ((before as any).mode ?? found2.mode) as any;

    if (!isDeletedDoc(before)) {
      return res.status(200).send({ ok: true, restored: false, mode: beforeMode });
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    const patch: any = {
      lifecycleStatus: "active",
      status: "active",
      updatedAt: now,
      deletedAt: admin.firestore.FieldValue.delete(),
      deletedBy: admin.firestore.FieldValue.delete(),
      deletedByUid: admin.firestore.FieldValue.delete(),
      deletedByEmail: admin.firestore.FieldValue.delete(),
    };

    await found2.ref.set(patch, { merge: true });

    const beforeAudit = pickSpotAuditFields(before);
    const afterAudit = pickSpotAuditFields({ ...before, lifecycleStatus: "active", status: "active", deletedAt: null, deletedBy: null });

    await writeAuditLog(req, "spots.restore", {
      targetType: "spot",
      targetId: id,
      changedFields: diffChangedFields(beforeAudit, afterAudit),
      before: beforeAudit,
      after: afterAudit,
      id,
      mode: beforeMode,
    });

    return res.status(200).send({ ok: true, restored: true, mode: beforeMode });
  } catch (e) {
    console.error(e);
    return res.status(500).send({ error: "Failed to restore spot" });
  }
});

/**
 * ✅ DELETE /admin/spots/:id  -> Soft Delete
 * - 문서 물리 삭제 금지
 * - status:"deleted", lifecycleStatus:"deleted", deletedAt, deletedBy 세팅
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const modeHint = (req.query.mode ? String(req.query.mode) : "") as "explorer" | "nightlife" | "";

    const found = await findSpotDocById(id, (modeHint as any) || undefined);
    const found2 = found ? found : await findSpotDocById(id, modeHint === "explorer" ? "nightlife" : "explorer");
    if (!found2) return res.status(404).send({ error: "Spot not found" });

    const before = found2.snap.data() || {};
    const beforeMode: "explorer" | "nightlife" = ((before as any).mode ?? found2.mode) as any;

    // idempotent
    if (isDeletedDoc(before)) {
      return res.status(200).send({ ok: true, softDeleted: false, mode: beforeMode });
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    const { uid, email } = getActor(req);

    const patch: any = {
      lifecycleStatus: "deleted",
      status: "deleted",
      deletedAt: now,
      deletedBy: { uid, email },
      deletedByUid: uid,
      deletedByEmail: email,
      updatedAt: now,
    };

    await found2.ref.set(patch, { merge: true });

    const beforeAudit = pickSpotAuditFields(before);
    const afterAudit = pickSpotAuditFields({
      ...before,
      lifecycleStatus: "deleted",
      status: "deleted",
      deletedAt: new Date().toISOString(),
      deletedBy: { uid, email },
    });

    await writeAuditLog(req, "spots.delete", {
      targetType: "spot",
      targetId: id,
      changedFields: diffChangedFields(beforeAudit, afterAudit),
      before: beforeAudit,
      after: afterAudit,
      id,
      mode: beforeMode,
      softDelete: true,
    });

    return res.status(200).send({ ok: true, mode: beforeMode, softDelete: true });
  } catch (e) {
    console.error(e);
    return res.status(500).send({ error: "Failed to delete spot" });
  }
});

export default router;
