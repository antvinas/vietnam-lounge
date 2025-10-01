import type { MoveMode } from '@/types/plan';

export async function estimateETA(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  mode: MoveMode
): Promise<{ minutes: number; cost?: number }> {
  // Haversine 대충 -> 거리(km) 근사
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  const km = 2 * R * Math.asin(Math.sqrt(a));
  let speed = 4; // km/h
  let cost;
  if (mode === 'walk') speed = 4;
  if (mode === 'bus') speed = 18;
  if (mode === 'grab') { speed = 25; cost = Math.max(15000, Math.round(km * 11000)); } // VND
  const minutes = Math.max(3, Math.round((km / speed) * 60));
  return new Promise((res) => setTimeout(() => res({ minutes, cost }), 200));
}
