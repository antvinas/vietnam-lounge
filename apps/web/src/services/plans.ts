// src/services/plans.ts
// - Firestore 접근 계층: 읽기/배치쓰기/트랜잭션 경계 명시
// - 동기화 설계 시 "읽기 → 쓰기" 순서, 충돌 시 재시도 트랜잭션을 염두(공식 가이드) :contentReference[oaicite:9]{index=9}
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
  query,
  where,
  deleteDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import type { Trip, Day, Item, Link } from "@/types/plan";

/** 경로 헬퍼 */
const tripsCol = () => collection(db, "trips");
const tripDoc = (tripId: string) => doc(tripsCol(), tripId);
const daysCol = (tripId: string) => collection(db, "trips", tripId, "days");
const itemsCol = (tripId: string) => collection(db, "trips", tripId, "items");
const linksCol = (tripId: string) => collection(db, "trips", tripId, "links");

/** 단건 읽기 */
export async function getTrip(tripId: string): Promise<Trip | null> {
  const snap = await getDoc(tripDoc(tripId));
  return snap.exists()
    ? ({ id: snap.id, ...(snap.data() as Omit<Trip, "id">) } as Trip)
    : null;
}

/** 그래프 일괄 로드 */
export async function getTripGraph(
  tripId: string
): Promise<{ trip: Trip; days: Day[]; items: Item[]; links: Link[] } | null> {
  const trip = await getTrip(tripId);
  if (!trip) return null;
  const [daysSnap, itemsSnap, linksSnap] = await Promise.all([
    getDocs(daysCol(tripId)),
    getDocs(itemsCol(tripId)),
    getDocs(linksCol(tripId)),
  ]);
  const days = daysSnap.docs.map(
    (d) => ({ id: d.id, ...(d.data() as Omit<Day, "id">) } as Day)
  );
  const items = itemsSnap.docs.map(
    (d) => ({ id: d.id, ...(d.data() as Omit<Item, "id">) } as Item)
  );
  const links = linksSnap.docs.map(
    (d) => ({ id: d.id, ...(d.data() as Omit<Link, "id">) } as Link)
  );
  return { trip, days, items, links };
}

/** 생성/수정 — 단건 */
export async function upsertTrip(trip: Trip): Promise<void> {
  await setDoc(tripDoc(trip.id), { ...trip, updatedAt: serverTimestamp() });
}

/** 다건 upsert — 배치(원자적) */
export async function upsertDays(tripId: string, days: Day[]): Promise<void> {
  const batch = writeBatch(db);
  for (const d of days) {
    batch.set(doc(daysCol(tripId), d.id), d, { merge: true });
  }
  await batch.commit();
}

export async function upsertItems(
  tripId: string,
  items: Item[]
): Promise<void> {
  const batch = writeBatch(db);
  for (const it of items) {
    batch.set(doc(itemsCol(tripId), it.id), it, { merge: true });
  }
  await batch.commit();
}

export async function upsertLinks(
  tripId: string,
  links: Link[]
): Promise<void> {
  const batch = writeBatch(db);
  for (const ln of links) {
    batch.set(doc(linksCol(tripId), ln.id), ln, { merge: true });
  }
  await batch.commit();
}

/**
 * 순서 재배치 — 단일 트랜잭션
 * - Firestore 트랜잭션은 충돌 시 자동 재시도됨. :contentReference[oaicite:10]{index=10}
 */
export async function batchReorderDays(
  tripId: string,
  orderedDayIds: string[]
): Promise<void> {
  await runTransaction(db, async (tx) => {
    for (let i = 0; i < orderedDayIds.length; i++) {
      const dref = doc(daysCol(tripId), orderedDayIds[i]);
      tx.set(dref, { order: i + 1 }, { merge: true });
    }
  });
}

/**
 * Day 삭제 + 종속 항목(아이템/링크) 일괄 삭제
 * - 쓰기는 하나의 배치로 묶어 원자성 확보. (Node SDK 기준 batch 설명) :contentReference[oaicite:11]{index=11}
 */
export async function deleteDayCascade(
  tripId: string,
  dayId: string
): Promise<void> {
  const [itemsSnap, linksSnap] = await Promise.all([
    getDocs(query(itemsCol(tripId), where("dayId", "==", dayId))),
    getDocs(linksCol(tripId)), // 링크는 다양한 참조를 가질 수 있어 일단 로드 후 필터
  ]);
  const batch = writeBatch(db);
  batch.delete(doc(daysCol(tripId), dayId));
  itemsSnap.forEach((d) => batch.delete(doc(itemsCol(tripId), d.id)));
  linksSnap.forEach((d) => {
    const ln = d.data() as Link;
    if (ln.tripId === tripId && (ln.fromItemId || ln.toItemId)) {
      // 해당 Day 아이템과 연결된 링크만 제거
      if ((ln as any).fromDayId === dayId || (ln as any).toDayId === dayId) {
        batch.delete(doc(linksCol(tripId), d.id));
      }
    }
  });
  await batch.commit();
}

/** 아이템 다건 삽입 — 새로 생성하는 케이스 */
export async function insertItemsBatch(
  tripId: string,
  items: Item[]
): Promise<void> {
  const batch = writeBatch(db);
  for (const it of items) {
    batch.set(doc(itemsCol(tripId), it.id), it);
  }
  await batch.commit();
}
