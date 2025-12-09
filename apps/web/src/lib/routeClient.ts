import type { MoveMode } from '@/types/plan';

const R = 6371; // km
const toRad = (x: number) => (x * Math.PI) / 180;

function haversineKm(from: { lat: number; lng: number }, to: { lat: number; lng: number }): number {
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// 간단 스로틀: 같은 key로 300ms 이내의 중복 호출 합치기
const inflight = new Map<string, { t: number; p: Promise<{ minutes: number; cost?: number; distanceKm: number }> }>();
const keyOf = (a: { lat: number; lng: number }, b: { lat: number; lng: number }, m: MoveMode) =>
  `${m}:${a.lat.toFixed(5)},${a.lng.toFixed(5)}>${b.lat.toFixed(5)},${b.lng.toFixed(5)}`;

export async function estimateETA(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  mode: MoveMode
): Promise<{ minutes: number; cost?: number; distanceKm: number }> {
  const km = haversineKm(from, to);
  if (!isFinite(km) || km <= 0.0001) {
    return { minutes: 0, cost: 0, distanceKm: 0 };
  }

  const k = keyOf(from, to, mode);
  const now = Date.now();
  const hit = inflight.get(k);
  if (hit && now - hit.t < 300) return hit.p;

  let speed = 4; // km/h
  let cost: number | undefined;

  if (mode === 'walk') speed = 4;
  else if (mode === 'transit') speed = 18;
  else {
    speed = 25;
    cost = Math.max(15000, Math.round(km * 11000)); // VND
  }

  const minutes = Math.max(3, Math.round((km / speed) * 60));
  const p = new Promise<{ minutes: number; cost?: number; distanceKm: number }>((res) =>
    setTimeout(() => res({ minutes, cost, distanceKm: km }), 200)
  );
  inflight.set(k, { t: now, p });
  return p;
}
