// apps/web/src/features/event/api/events.api.ts

import { collection, getDocs, doc, getDoc, query, where } from "firebase/firestore";
import { db } from "@/config/firebase";
import type { Event } from "@/types/event";

export type { Event };

function toYmd(d: Date) {
  return d.toISOString().slice(0, 10);
}

function safeDate(v: any): Date | null {
  try {
    if (!v) return null;
    if (v instanceof Date) return v;
    if (typeof v?.toDate === "function") return v.toDate(); // Firestore Timestamp
    if (typeof v?.seconds === "number") return new Date(v.seconds * 1000);
    if (typeof v === "number") return new Date(v);
    if (typeof v === "string") {
      // YYYY-MM-DD or ISO
      const d = new Date(v);
      if (!Number.isNaN(d.getTime())) return d;
      // try YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(`${v}T00:00:00Z`);
    }
    return null;
  } catch {
    return null;
  }
}

function pickYmd(v: any): string | "" {
  if (!v) return "";
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const d = safeDate(v);
  return d ? toYmd(d) : "";
}

/**
 * ✅ 레거시/혼재 스키마를 흡수해서 UI에서 쓰는 Event 타입으로 고정
 * - name/title, imageUrl/image, gallery/images 등 필드명이 흔들려도 안전
 */
export function normalizeEvent(id: string, data: any): Event {
  const date = pickYmd(data?.date) || pickYmd(data?.startDate) || pickYmd(data?.createdAt) || toYmd(new Date());
  const endDate =
    pickYmd(data?.endDate) ||
    pickYmd(data?.endAt) ||
    pickYmd(data?.end) ||
    date;

  const imageUrl =
    String(data?.imageUrl || data?.image || data?.thumbnailUrl || data?.thumbnail || "").trim();

  const galleryRaw = data?.gallery ?? data?.imageUrls ?? data?.images ?? [];
  const gallery: string[] | undefined = Array.isArray(galleryRaw)
    ? galleryRaw.map((x) => String(x)).filter(Boolean)
    : undefined;

  return {
    id,
    name: String(data?.name ?? data?.title ?? "").trim() || "(Untitled)",
    description: String(data?.description ?? data?.content ?? "").trim() || "",
    imageUrl,
    date,
    endDate,
    location: String(data?.location ?? data?.address ?? data?.venue ?? "").trim() || "",
    city: data?.city ? String(data.city) : undefined,
    category: String(data?.category ?? "Festival"),
    organizer: String(data?.organizer ?? data?.host ?? ""),
    gallery,
  };
}

const getCollectionName = (isNight: boolean) => (isNight ? "adult_events" : "events");

/**
 * ✅ Step 3.5 대응
 * Firestore Rules가 "공개(visibility/isPublic)"만 read 허용하면,
 * 전체 컬렉션 get()은 쿼리 자체가 실패할 수 있음(규칙은 필터가 아님).
 * 그래서 '공개' 조건으로만 쿼리해서 안전하게 목록을 가져온다.
 */
async function getPublicEventDocs(colName: string) {
  const colRef = collection(db, colName);

  // OR 쿼리는 운영/인덱스 복잡도가 커서, 안전한 2개 쿼리 병합으로 처리
  const [a, b] = await Promise.all([
    getDocs(query(colRef, where("visibility", "==", "public"))),
    getDocs(query(colRef, where("isPublic", "==", true))),
  ]);

  const map = new Map<string, any>();
  for (const snap of [a, b]) {
    for (const d of snap.docs) map.set(d.id, d.data());
  }

  return Array.from(map.entries()).map(([id, data]) => ({ id, data }));
}

/**
 * 유저/어드민 공용: 전체 목록
 */
export const getEvents = async (isNight: boolean = false): Promise<Event[]> => {
  const colName = getCollectionName(isNight);

  const docs = await getPublicEventDocs(colName);
  const items = docs.map((x) => normalizeEvent(x.id, x.data));
  items.sort((a, b) => a.date.localeCompare(b.date));
  return items;
};

/**
 * 유저 화면: "오늘 이후" upcoming
 * - Firestore에서 endDate 타입이 String/Timestamp로 섞여 있어도, 로컬 필터로 안전하게 동작
 */
export const fetchEvents = async (isNight = false): Promise<Event[]> => {
  const all = await getEvents(isNight);
  const today = toYmd(new Date());
  const upcoming = all.filter((e) => (e.endDate || e.date) >= today);
  upcoming.sort((a, b) => a.date.localeCompare(b.date));
  return upcoming;
};

export const getEventById = async (id: string): Promise<Event | null> => {
  // events 우선
  try {
    let ref = doc(db, "events", id);
    let snap = await getDoc(ref);
    if (snap.exists()) return normalizeEvent(snap.id, snap.data());

    // nightlife fallback
    ref = doc(db, "adult_events", id);
    snap = await getDoc(ref);
    if (snap.exists()) return normalizeEvent(snap.id, snap.data());
  } catch {
    // ✅ 비공개/임시저장 이벤트는 Rules에서 차단되므로, 유저 화면에서는 null 처리
    return null;
  }
  return null;
};
