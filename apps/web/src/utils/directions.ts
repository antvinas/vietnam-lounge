// apps/web/src/utils/directions.ts

// 🟢 [핵심] store가 아닌 types에서 import
import type { Item, TransportMode } from "@/types/plan";
import { getRoute } from "@/lib/directionsClient";

export async function calculateRoute(fromItem: Item, toItem: Item) {
  if (!fromItem.lat || !fromItem.lng || !toItem.lat || !toItem.lng) {
    return null;
  }

  // 🟢 TransportMode 타입 호환
  const mode = (fromItem.transportMode || "car") as "car" | "walk" | "transit" | "bike";

  return getRoute({
    origin: { lat: fromItem.lat, lng: fromItem.lng },
    destination: { lat: toItem.lat, lng: toItem.lng },
    mode: mode, 
  });
}