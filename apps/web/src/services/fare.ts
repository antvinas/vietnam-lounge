/* 간단 요금 추정기. 도시×차종별 정책 JSON 기반 */
import hanoi from "@/config/fare.hanoi.json";

export type FareVehicle = "car" | "bike";
export type FarePolicy = {
  base: number; // 기본요금
  per_km: number; // km당
  per_min: number; // 분당
  surge_min: number; // 최소 승수
  surge_max: number; // 최대 승수
  booking_fee?: number; // 호출/기본 수수료
};
export type CityFareConfig = Record<FareVehicle, FarePolicy>;

const Cities: Record<string, CityFareConfig> = {
  hanoi: hanoi as CityFareConfig,
};

export function getFarePolicy(city: string, vehicle: FareVehicle): FarePolicy {
  const cfg = Cities[city];
  if (!cfg) throw new Error(`Unknown city policy: ${city}`);
  return cfg[vehicle];
}

export function estimateFare(city: string, vehicle: FareVehicle, distanceKm: number, durationMin: number) {
  const p = getFarePolicy(city, vehicle);
  const core = p.base + p.per_km * distanceKm + p.per_min * durationMin + (p.booking_fee ?? 0);
  const low = Math.max(0, Math.round(core * p.surge_min));
  const high = Math.max(low, Math.round(core * p.surge_max));
  return { low, high };
}

export function formatFare(vnd: number, locale = "vi-VN") {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(vnd);
}
