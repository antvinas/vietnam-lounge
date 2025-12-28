// apps/web/src/utils/sim/traffic.ts

import { DirectionsResult } from "@/lib/directionsClient";

export async function simulateTraffic(
  result: DirectionsResult | null
): Promise<DirectionsResult | null> {
  if (!result) return null;

  // 단순 시뮬레이션: 약간의 지연 시간 추가
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(result);
    }, 500);
  });
}

// 🟢 [수정] 타입 안전한 옵션 생성
export const getTrafficOptions = (mode: string) => {
  const baseOptions: google.maps.DrivingOptions = {
    departureTime: new Date(),
    trafficModel: google.maps.TrafficModel.BEST_GUESS,
  };

  if (mode === "pessimistic") {
    baseOptions.trafficModel = google.maps.TrafficModel.PESSIMISTIC;
  } else if (mode === "optimistic") {
    baseOptions.trafficModel = google.maps.TrafficModel.OPTIMISTIC;
  }

  return baseOptions;
};