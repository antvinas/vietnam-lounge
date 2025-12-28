// apps/web/src/features/admin/api/spots/spots.api.ts

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as qLimit,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { db, storage, auth } from "@/lib/firebase";

import type { AdminMode, AdminSpotCursor, AdminSpotFilter } from "../types";
import { clampInt, normalizeText, safeDelete, safeGet, safePost, safePut } from "../http";

// --------------------------------------------
// Internal helpers
// --------------------------------------------

const colForMode = (mode: AdminMode, base: string) => (mode === "nightlife" ? `adult_${base}` : base);

async function firstDocOrNull(pathA: string, id: string, pathB?: string) {
  const refA = doc(db, pathA, id);
  const snapA = await getDoc(refA);
  if (snapA.exists()) return { ref: refA, snap: snapA, col: pathA };
  if (!pathB) return null;
  const refB = doc(db, pathB, id);
  const snapB = await getDoc(refB);
  if (snapB.exists()) return { ref: refB, snap: snapB, col: pathB };
  return null;
}

/** cursor를 서버로 전달할 string으로 통일 */
function normalizeCursor(cursor?: AdminSpotCursor | null): string | undefined {
  if (!cursor) return undefined;
  if (typeof cursor === "string") {
    const c = cursor.trim();
    return c ? c : undefined;
  }
  const id = String(cursor.id || "").trim();
  const sortAt = cursor.sortAt;
  if (!id) return undefined;
  try {
    return JSON.stringify({ id, sortAt });
  } catch {
    return undefined;
  }
}

function normalizeSpotBudgetFields(input: any) {
  const plRaw = input?.priceLevel;
  const pl = plRaw === null || plRaw === undefined || plRaw === "" ? undefined : clampInt(plRaw, 0, 4, 0);

  const budgetRaw = input?.budget;
  const budgetNum = Number(budgetRaw);
  const budget = Number.isFinite(budgetNum) && budgetNum > 0 ? budgetNum : undefined;

  const budgetUnit = normalizeText(input?.budgetUnit);
  const budgetText = normalizeText(input?.budgetText);

  return { priceLevel: pl, budget, budgetUnit, budgetText };
}

function normalizeSpotForClient(input: any) {
  const mode: AdminMode = input?.mode === "nightlife" ? "nightlife" : "explorer";

  const name = String(input?.name ?? "").trim();
  const category = input?.category ? String(input.category) : "";
  const locationId = input?.locationId ? String(input.locationId) : "";
  const region = input?.region ? String(input.region) : locationId;

  const address = input?.address ? String(input.address) : "";
  const description = input?.description ? String(input.description) : "";
  const openHours = input?.openHours ? String(input.openHours) : "";

  const rating = typeof input?.rating === "number" ? input.rating : Number(input?.rating ?? 0) || 0;

  const { priceLevel, budget, budgetUnit, budgetText } = normalizeSpotBudgetFields(input);

  const imageUrls: string[] = Array.isArray(input?.imageUrls)
    ? input.imageUrls.map((x: any) => String(x)).filter(Boolean)
    : Array.isArray(input?.images)
      ? input.images
          .map((x: any) => (typeof x === "string" ? x : x?.url))
          .map((x: any) => String(x))
          .filter(Boolean)
      : [];

  const images: string[] = Array.isArray(input?.images)
    ? input.images
        .map((x: any) => (typeof x === "string" ? x : x?.url))
        .map((x: any) => String(x))
        .filter(Boolean)
    : imageUrls;

  const thumbnailUrl = String(input?.thumbnailUrl ?? imageUrls?.[0] ?? images?.[0] ?? "").trim() || null;

  const lat =
    typeof input?.latitude === "number"
      ? input.latitude
      : typeof input?.location?.lat === "number"
        ? input.location.lat
        : Number(input?.latitude ?? input?.location?.lat ?? 0) || 0;

  const lng =
    typeof input?.longitude === "number"
      ? input.longitude
      : typeof input?.location?.lng === "number"
        ? input.location.lng
        : Number(input?.longitude ?? input?.location?.lng ?? 0) || 0;

  const location =
    input?.location && typeof input.location === "object"
      ? { lat, lng, address: String(input.location.address ?? address ?? "") }
      : { lat, lng, address: address ?? "" };

  const isSponsored = Boolean(input?.isSponsored);
  const sponsorLevel = input?.sponsorLevel ?? null;
  const sponsorExpiry = input?.sponsorExpiry ?? null;

  return {
    ...input,
    mode,
    name,
    category,
    locationId,
    region,
    address,
    description,
    openHours,
    rating,

    priceLevel,
    budget,
    budgetUnit,
    budgetText,

    images,
    imageUrls,
    thumbnailUrl,

    latitude: lat,
    longitude: lng,
    location,

    isSponsored,
    sponsorLevel,
    sponsorExpiry,
  };
}

function normalizeSpotForStore(input: any) {
  const base = normalizeSpotForClient(input);
  // IMPORTANT: 관리자 Write는 서버(Functions/API)에서 타임스탬프/검증/감사로그를 책임진다.
  // Firestore serverTimestamp() 같은 sentinel 값은 HTTP payload로 안전하게 직렬화되지 않으므로 제거.
  return { ...base };
}

// --------------------------------------------
// Public types/exports
// --------------------------------------------

export type AdminSpotListResponse = {
  items: any[];
  limit: number;
  hasNext: boolean;
  page: number; // legacy
  nextCursor?: string | null; // cursor
};

// --------------------------------------------
// Spots API
// --------------------------------------------

export const getFilteredSpots = async (filter: AdminSpotFilter): Promise<AdminSpotListResponse> => {
  const mode = filter.mode;
  const region = String(filter.region || "ALL").trim();
  const category = String(filter.category || "ALL").trim();

  // ✅ Soft delete 대응
  const status = String((filter as any)?.status ?? "all").trim();
  const includeDeleted = Boolean((filter as any)?.includeDeleted) || status === "deleted";

  const per = clampInt(filter.limit, 20, 200, 20);
  const page = clampInt(filter.page, 1, 9999, 1);
  const cursor = normalizeCursor(filter.cursor);

  try {
    const raw: any = await safeGet("admin/spots", {
      mode,
      region,
      category,
      limit: per,
      ...(status && status !== "all" ? { status } : {}),
      ...(includeDeleted ? { includeDeleted: 1 } : {}),
      ...(cursor ? { cursor } : { page }),
    });

    const rawItems = Array.isArray(raw?.items) ? raw.items : Array.isArray(raw) ? raw : [];
    const items = rawItems.map((x: any) => normalizeSpotForClient(x));

    const hasNext = typeof raw?.hasNext === "boolean" ? raw.hasNext : items.length >= per;

    const nextCursor =
      typeof raw?.nextCursor === "string" ? raw.nextCursor : raw?.nextCursor == null ? null : String(raw.nextCursor);

    return {
      items,
      page: Number(raw?.page ?? page),
      limit: Number(raw?.limit ?? per),
      hasNext,
      nextCursor,
    };
  } catch (e) {
    console.warn("[admin.api] GET admin/spots failed, fallback to Firestore client:", e);
  }

  // Firestore fallback (read-only)
  const colName = mode === "nightlife" ? "adult_spots" : "spots";
  const take = page * per + 1;

  let qRef: any = query(collection(db, colName));
  if (region !== "ALL") qRef = query(qRef, where("locationId", "==", region));
  if (category !== "ALL") qRef = query(qRef, where("category", "==", category));

  let snap: any;
  try {
    snap = await getDocs(query(qRef, orderBy("updatedAt", "desc"), qLimit(take)));
  } catch {
    try {
      snap = await getDocs(query(qRef, orderBy("createdAt", "desc"), qLimit(take)));
    } catch {
      snap = await getDocs(query(qRef, qLimit(take)));
    }
  }

  const all = snap.docs.map((d: any) => normalizeSpotForClient({ id: d.id, ...d.data() }));

  const isDeleted = (s: any) => {
    const st = String(s?.status ?? "").toLowerCase();
    return st === "deleted" || Boolean(s?.deletedAt);
  };
  const isDraft = (s: any) => String(s?.status ?? "").toLowerCase() === "draft";
  const matchStatus = (s: any) => {
    if (status === "deleted") return isDeleted(s);
    if (status === "draft") return !isDeleted(s) && isDraft(s);
    if (status === "active") return !isDeleted(s) && !isDraft(s);
    return includeDeleted ? true : !isDeleted(s);
  };

  const filteredAll = all.filter(matchStatus);
  const start = (page - 1) * per;

  const pagePlusOne = filteredAll.slice(start, start + per + 1);
  const hasNext = pagePlusOne.length > per;
  const items = hasNext ? pagePlusOne.slice(0, per) : pagePlusOne;

  return { items, page, limit: per, hasNext, nextCursor: null };
};

// ✅ Soft delete (휴지통 이동)
export const deleteSpot = async (id: string, mode: AdminMode) => {
  // ✅ 운영툴 정석: Write 경로는 서버로 단일화 (클라 Firestore fallback 금지)
  await safeDelete(`admin/spots/${id}`, { mode });
  return { ok: true };
};

// ✅ Soft delete 복구(휴지통 → 복원)
export const restoreSpot = async (id: string, mode: AdminMode) => {
  // 백엔드에서 구현 권장: POST /admin/spots/:id/restore
  await safePost(`admin/spots/${id}/restore`, { mode });
  return { ok: true };
};

export const getSpotById = async (id: string, modeHint?: AdminMode): Promise<any | null> => {
  const tryServer = async (mode?: AdminMode) => {
    const params: any = {};
    if (mode) params.mode = mode;
    return await safeGet<any>(`admin/spots/${id}`, params);
  };

  try {
    const raw = modeHint ? await tryServer(modeHint) : await tryServer();
    return raw ? normalizeSpotForClient(raw) : null;
  } catch {
    if (!modeHint) {
      try {
        const raw = await tryServer("explorer");
        return raw ? normalizeSpotForClient(raw) : null;
      } catch {}
      try {
        const raw = await tryServer("nightlife");
        return raw ? normalizeSpotForClient(raw) : null;
      } catch {}
    }
  }

  // Firestore fallback (read-only)
  if (modeHint) {
    const colName = colForMode(modeHint, "spots");
    const snap = await getDoc(doc(db, colName, id));
    if (!snap.exists()) return null;
    return normalizeSpotForClient({ id, mode: modeHint, ...snap.data() });
  }

  const found = await firstDocOrNull("spots", id, "adult_spots");
  if (!found) return null;

  const mode: AdminMode = found.col === "adult_spots" ? "nightlife" : "explorer";
  return normalizeSpotForClient({ id, mode, ...found.snap.data() });
};

export const addSpot = async (input: any): Promise<{ id: string }> => {
  const payload = normalizeSpotForStore(input);

  // ✅ 운영툴 정석: Write 경로는 서버로 단일화 (클라 Firestore fallback 금지)
  const raw: any = await safePost("admin/spots", payload);
  const id = String(raw?.id ?? raw?.spotId ?? raw?.data?.id ?? "").trim();
  if (!id) throw new Error("Server did not return id");
  return { id };
};

export const updateSpot = async (id: string, input: any): Promise<{ ok: true }> => {
  const payload = normalizeSpotForStore(input);
  await safePut(`admin/spots/${id}`, payload);
  return { ok: true };
};

/**
 * ✅ UI 부작용(Toast)을 제거한 순수 업로더
 * - 업로드 성공/실패 메시지는 "호출하는 UI"에서 처리하세요.
 */
export const uploadSpotImages = async (files: File[]): Promise<string[]> => {
  if (!files?.length) return [];
  const u = auth.currentUser;
  const uid = u?.uid || "anonymous";

  const uploaded: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const safeName = f.name.replaceAll(/[^a-zA-Z0-9._-]/g, "_");
    const path = `admin_uploads/spots/${uid}/${Date.now()}_${i}_${safeName}`;
    const r = ref(storage, path);
    await uploadBytes(r, f);
    uploaded.push(await getDownloadURL(r));
  }

  return uploaded;
};
