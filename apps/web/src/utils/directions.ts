/* apps/web/src/utils/directions.ts */
import type { Item, TransportMode, PlaceLite } from "@/features/plan/stores/plan.store";
import { getRoute, type Mode } from "@/lib/directionsClient";

export type PathPoint = { lat: number; lng: number };
export type PathSummary = {
  path: PathPoint[];
  minutes: number;
  distanceKm: number;
  segments: number;
};

const routeCache = new Map<string, Awaited<ReturnType<typeof getRoute>>>();

function keyFor(a: PathPoint, b: PathPoint, mode: Mode) {
  return `${a.lat.toFixed(5)},${a.lng.toFixed(5)},${b.lat.toFixed(5)},${b.lng.toFixed(5)}|${mode}`;
}

function decodePolyline(encoded: string): PathPoint[] {
  let index = 0, lat = 0, lng = 0, coordinates: PathPoint[] = [];
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : result >> 1; lat += dlat;
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    const dlng = (result & 1) ? ~(result >> 1) : result >> 1; lng += dlng;
    coordinates.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return coordinates;
}

function toMode(m?: TransportMode): Mode {
  if (m === "walk") return "WALKING";
  if (m === "transit") return "TRANSIT";
  if (m === "bike") return "BICYCLING";
  return "DRIVING";
}

/** 정규화 Item[] + places 맵을 경로로 직조 */
export async function buildPathFromItems(
  items: Item[],
  places: Record<string, PlaceLite>,
  fallbackMode: Mode = "DRIVING"
): Promise<PathSummary> {
  const pts: { idx: number; lat: number; lng: number }[] = [];
  items.forEach((b, i) => {
    if (b.placeId) {
      const p = places[b.placeId];
      if (p && typeof p.lat === "number" && typeof p.lng === "number") {
        pts.push({ idx: i, lat: p.lat, lng: p.lng });
      }
    }
  });
  if (pts.length < 2) {
    return { path: pts.map((p) => ({ lat: p.lat, lng: p.lng })), minutes: 0, distanceKm: 0, segments: 0 };
  }

  let minutes = 0;
  let dist = 0;
  let seg = 0;
  const fullPath: PathPoint[] = [];

  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const between = items.slice(a.idx, b.idx + 1).find((x) => x.type === "custom"); // custom=move 성격일 경우 모드 힌트
    const mode = toMode((between as any)?.mode as TransportMode) || fallbackMode;

    const k = keyFor({ lat: a.lat, lng: a.lng }, { lat: b.lat, lng: b.lng }, mode);
    const hit = routeCache.get(k);
    const r = hit || (await getRoute({ origin: { lat: a.lat, lng: a.lng }, destination: { lat: b.lat, lng: b.lng }, mode }));
    if (!hit) routeCache.set(k, r);

    if (r.polyline) {
      const segPath = decodePolyline(r.polyline);
      if (fullPath.length && segPath.length) {
        const last = fullPath[fullPath.length - 1];
        if (last.lat === segPath[0].lat && last.lng === segPath[0].lng) segPath.shift();
      }
      fullPath.push(...segPath);
    } else {
      if (fullPath.length) fullPath.push({ lat: b.lat, lng: b.lng });
      else fullPath.push({ lat: a.lat, lng: a.lng }, { lat: b.lat, lng: b.lng });
    }

    minutes += Math.round((r.totalDurationSeconds || 0) / 60);
    dist += (r.totalDistanceMeters || 0) / 1000;
    seg++;
  }

  return { path: fullPath, minutes, distanceKm: +dist.toFixed(1), segments: seg };
}
